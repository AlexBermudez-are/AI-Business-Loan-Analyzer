const {
  sequelize,
  AnalysisHistory,
  Business,
  Currency,
  LoanApplication,
  LoanApplicationExchangeRate,
  LoanAnalysis,
} = require('../models');
const { Op } = require('sequelize');
const getAIProvider = require('../providers/aiProviderFactory');
const buildLoanAnalysisPrompt = require('../prompts/loanAnalysis.prompt');
const calculateFinancialMetrics = require('../utils/calculateFinancialMetrics');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { resolveSignedExchangeRates } = require('./exchangeRateService');
const {
  parseLoanAnalysisResponse,
} = require('../validations/loanAnalysisResponseSchema');

const currencyRelationships = [
  ['monthlyRevenueCurrencyCode', 'monthlyRevenueCurrency'],
  ['monthlyExpensesCurrencyCode', 'monthlyExpensesCurrency'],
  ['existingDebtCurrencyCode', 'existingDebtCurrency'],
  ['monthlyDebtPaymentCurrencyCode', 'monthlyDebtPaymentCurrency'],
  ['requestedAmountCurrencyCode', 'requestedAmountCurrency'],
];

const currencyIncludes = () =>
  currencyRelationships.map(([, as]) => ({
    model: Currency,
    as,
    required: true,
    attributes: ['code', 'name', 'minorUnit'],
  }));

const exchangeRateInclude = () => ({
  model: LoanApplicationExchangeRate,
  as: 'exchangeRates',
  required: false,
  include: [
    {
      model: Currency,
      as: 'fromCurrency',
      attributes: ['code', 'name', 'minorUnit'],
    },
    {
      model: Currency,
      as: 'toCurrency',
      attributes: ['code', 'name', 'minorUnit'],
    },
  ],
});

const ensureCurrenciesExist = async (financialData) => {
  const requestedCodes = [
    financialData.monthlyRevenueCurrencyCode,
    financialData.monthlyExpensesCurrencyCode,
    financialData.existingDebtCurrencyCode,
    financialData.monthlyDebtPaymentCurrencyCode,
    financialData.requestedAmountCurrencyCode,
    ...(financialData.exchangeRates || []).flatMap((exchangeRate) => [
      exchangeRate.fromCurrencyCode,
      exchangeRate.toCurrencyCode,
    ]),
  ];
  const uniqueCodes = [...new Set(requestedCodes)];
  const storedCurrencies = await Currency.findAll({
    where: { code: uniqueCodes },
    attributes: ['code'],
  });
  const storedCodes = new Set(storedCurrencies.map(({ code }) => code));
  const missingCodes = uniqueCodes.filter((code) => !storedCodes.has(code));

  if (missingCodes.length > 0) {
    throw new AppError(
      'VALIDATION_ERROR',
      'One or more currency codes are not supported.',
      400,
      { currencyCodes: missingCodes },
    );
  }
};

const generateValidatedAnalysis = async ({
  business,
  financialData,
  financialMetrics,
}) => {
  const provider = getAIProvider();

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const prompts = buildLoanAnalysisPrompt({
      business,
      financialData,
      financialMetrics,
      isRetry: attempt === 1,
    });

    const providerResponse = await provider.generateLoanAnalysis(prompts);

    try {
      return {
        analysis: parseLoanAnalysisResponse(providerResponse.content),
        provider: providerResponse.provider,
        model: providerResponse.model,
      };
    } catch (error) {
      const canRetry = error.code === 'AI_INVALID_RESPONSE' && attempt === 0;

      if (!canRetry) throw error;
    }
  }

  throw new AppError(
    'AI_INVALID_RESPONSE',
    'The AI provider returned an incompatible response.',
    502,
  );
};

const ownedApplicationInclude = (userId) => [
  {
    model: Business,
    as: 'business',
    where: { userId },
    required: true,
    attributes: { exclude: ['userId'] },
  },
  {
    model: LoanAnalysis,
    as: 'analysis',
  },
  ...currencyIncludes(),
  exchangeRateInclude(),
];

const getLoanApplicationById = async ({ id, userId }) => {
  const loanApplication = await LoanApplication.findOne({
    where: { id },
    include: ownedApplicationInclude(userId),
  });

  if (!loanApplication) {
    throw new AppError(
      'RESOURCE_NOT_FOUND',
      'Loan application not found.',
      404,
    );
  }

  return loanApplication;
};

const getLatestLoanApplication = ({ userId }) =>
  LoanApplication.findOne({
    include: ownedApplicationInclude(userId),
    order: [['createdAt', 'DESC']],
  });

const encodeHistoryCursor = (historyEntry) =>
  Buffer.from(
    JSON.stringify({
      createdAt: historyEntry.createdAt.toISOString(),
      id: historyEntry.id,
    }),
  ).toString('base64url');

const decodeHistoryCursor = (cursor) => {
  if (!cursor) return null;

  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString());
    const createdAt = new Date(parsed.createdAt);
    const isUuid =
      typeof parsed.id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        parsed.id,
      );

    if (Number.isNaN(createdAt.getTime()) || !isUuid) throw new Error();

    return { createdAt, id: parsed.id };
  } catch (_error) {
    throw new AppError(
      'VALIDATION_ERROR',
      'The history cursor is invalid.',
      400,
    );
  }
};

const getLoanAnalysisHistory = async ({ userId, limit, cursor }) => {
  const decodedCursor = decodeHistoryCursor(cursor);
  const where = { userId };

  if (decodedCursor) {
    where[Op.or] = [
      { createdAt: { [Op.lt]: decodedCursor.createdAt } },
      {
        createdAt: decodedCursor.createdAt,
        id: { [Op.lt]: decodedCursor.id },
      },
    ];
  }

  const rows = await AnalysisHistory.findAll({
    where,
    include: [
      {
        model: LoanApplication,
        as: 'loanApplication',
        required: true,
        include: [
          {
            model: Business,
            as: 'business',
            required: true,
            attributes: { exclude: ['userId'] },
          },
          {
            model: LoanAnalysis,
            as: 'analysis',
            required: true,
          },
          ...currencyIncludes(),
          exchangeRateInclude(),
        ],
      },
    ],
    order: [
      ['createdAt', 'DESC'],
      ['id', 'DESC'],
    ],
    limit: limit + 1,
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const lastItem = items.at(-1);

  return {
    items,
    pageInfo: {
      hasMore,
      nextCursor: hasMore && lastItem ? encodeHistoryCursor(lastItem) : null,
    },
  };
};

const analyzeLoanApplication = async ({ userId, payload }) => {
  const { business: businessData, financialData } = payload;
  const exchangeRates = resolveSignedExchangeRates({ userId, financialData });
  const applicationFinancialData = {
    monthlyRevenue: financialData.monthlyRevenue,
    monthlyRevenueCurrencyCode: financialData.monthlyRevenueCurrencyCode,
    monthlyExpenses: financialData.monthlyExpenses,
    monthlyExpensesCurrencyCode: financialData.monthlyExpensesCurrencyCode,
    existingDebt: financialData.existingDebt,
    existingDebtCurrencyCode: financialData.existingDebtCurrencyCode,
    monthlyDebtPayment: financialData.monthlyDebtPayment,
    monthlyDebtPaymentCurrencyCode:
      financialData.monthlyDebtPaymentCurrencyCode,
    requestedAmount: financialData.requestedAmount,
    requestedAmountCurrencyCode: financialData.requestedAmountCurrencyCode,
    loanPurpose: financialData.loanPurpose,
  };
  const normalizedFinancialData = {
    ...applicationFinancialData,
    exchangeRates,
  };
  await ensureCurrenciesExist(normalizedFinancialData);
  const financialMetrics = calculateFinancialMetrics(normalizedFinancialData);

  let loanApplication;

  await sequelize.transaction(async (transaction) => {
    const [business, created] = await Business.findOrCreate({
      where: {
        userId,
        name: businessData.name,
      },
      defaults: {
        userId,
        ...businessData,
      },
      transaction,
    });

    if (
      !created &&
      (business.industry !== businessData.industry ||
        business.yearsInBusiness !== businessData.yearsInBusiness)
    ) {
      await business.update(
        {
          industry: businessData.industry,
          yearsInBusiness: businessData.yearsInBusiness,
        },
        { transaction },
      );
    }

    loanApplication = await LoanApplication.create(
      {
        businessId: business.id,
        ...applicationFinancialData,
        status: 'analyzing',
      },
      { transaction },
    );

    if (exchangeRates.length > 0) {
      await LoanApplicationExchangeRate.bulkCreate(
        exchangeRates.map((exchangeRate) => ({
          loanApplicationId: loanApplication.id,
          ...exchangeRate,
        })),
        { transaction, validate: true },
      );
    }
  });

  try {
    const providerResult = await generateValidatedAnalysis({
      business: businessData,
      financialData: normalizedFinancialData,
      financialMetrics,
    });

    await sequelize.transaction(async (transaction) => {
      await LoanAnalysis.create(
        {
          loanApplicationId: loanApplication.id,
          provider: providerResult.provider,
          model: providerResult.model,
          ...providerResult.analysis,
          financialMetrics,
        },
        { transaction },
      );

      await AnalysisHistory.create(
        {
          userId,
          loanApplicationId: loanApplication.id,
        },
        { transaction },
      );

      await loanApplication.update({ status: 'analyzed' }, { transaction });
    });
  } catch (error) {
    try {
      await LoanApplication.update(
        { status: 'failed' },
        { where: { id: loanApplication.id } },
      );
    } catch (_statusError) {
      logger.error('loan_application_status_update_failed', {
        loanApplicationId: loanApplication.id,
      });
    }

    throw error;
  }

  return getLoanApplicationById({ id: loanApplication.id, userId });
};

module.exports = {
  analyzeLoanApplication,
  getLoanAnalysisHistory,
  getLatestLoanApplication,
  getLoanApplicationById,
};
