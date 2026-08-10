const { Op } = require('sequelize');
const { Currency, ExchangeRateQuote } = require('../models');
const getAIProvider = require('../providers/aiProviderFactory');
const {
  parseExchangeRateSearchResponse,
} = require('../validations/exchangeRateResponseSchema');
const {
  generateExchangeRateQuoteToken,
  verifyExchangeRateQuoteToken,
} = require('../token/exchangeRateQuoteToken');
const {
  getRequiredExchangeRateTargets,
  USD_BASE_CURRENCY,
} = require('../utils/exchangeRates');
const AppError = require('../utils/AppError');

const CACHE_TTL_MS = 15 * 60 * 1000;
const DATABASE_REUSE_TTL_MS = 60 * 60 * 1000;
const RATE_LIMIT_FALLBACK_TTL_MS = 24 * 60 * 60 * 1000;
const quoteCache = new Map();

const ensureCurrenciesExist = async (currencyCodes) => {
  const currencies = await Currency.findAll({
    where: { code: currencyCodes },
    attributes: ['code'],
  });
  const found = new Set(currencies.map(({ code }) => code));
  const missing = currencyCodes.filter((code) => !found.has(code));

  if (missing.length > 0) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Una o más divisas no están disponibles.',
      400,
      { currencyCodes: missing },
    );
  }
};

const getCachedResult = (key) => {
  const cached = quoteCache.get(key);
  if (!cached || Date.now() - cached.cachedAt >= CACHE_TTL_MS) {
    quoteCache.delete(key);
    return null;
  }

  return { ...cached, cacheStatus: 'memory' };
};

const findStoredQuotes = async (targetCurrencyCodes, maxAgeMs) => {
  const rows = await ExchangeRateQuote.findAll({
    where: {
      fromCurrencyCode: USD_BASE_CURRENCY,
      toCurrencyCode: { [Op.in]: targetCurrencyCodes },
      retrievedAt: { [Op.gte]: new Date(Date.now() - maxAgeMs) },
      sourceUrl: { [Op.ne]: null },
    },
    attributes: [
      'fromCurrencyCode',
      'toCurrencyCode',
      'rate',
      'quotedAt',
      'sourceName',
      'sourceUrl',
      'provider',
      'model',
      'retrievedAt',
    ],
    order: [['retrievedAt', 'DESC']],
  });
  const latestByTarget = new Map();

  rows.forEach((row) => {
    if (latestByTarget.has(row.toCurrencyCode)) return;
    const rate = Number(row.rate);
    if (!Number.isFinite(rate) || rate <= 0) return;

    latestByTarget.set(row.toCurrencyCode, {
      fromCurrencyCode: row.fromCurrencyCode,
      toCurrencyCode: row.toCurrencyCode,
      rate,
      quotedAt: row.quotedAt,
      sourceName: row.sourceName,
      sourceUrl: row.sourceUrl,
      provider: row.provider,
      model: row.model,
      retrievedAt: row.retrievedAt.toISOString(),
    });
  });

  if (latestByTarget.size !== targetCurrencyCodes.length) return null;

  const quotes = targetCurrencyCodes.map((code) => latestByTarget.get(code));
  const providers = [...new Set(quotes.map(({ provider }) => provider))];
  const models = [...new Set(quotes.map(({ model }) => model))];
  const retrievedAt = quotes
    .map(({ retrievedAt: value }) => value)
    .sort()
    .at(0);

  return {
    quotes,
    provider: providers.length === 1 ? providers[0] : 'database-cache',
    model: models.length === 1 ? models[0] : 'mixed',
    retrievedAt,
  };
};

const searchExchangeRates = async (targetCurrencyCodes) => {
  const provider = getAIProvider();
  const cacheKey = `${provider.name}:${provider.model}:${targetCurrencyCodes.join(',')}`;
  const cached = getCachedResult(cacheKey);
  if (cached) return cached;

  const response = await provider.searchExchangeRates({ targetCurrencyCodes });
  const parsedQuotes = parseExchangeRateSearchResponse(
    response.content,
    targetCurrencyCodes,
  );
  const retrievedAt = new Date().toISOString();
  const result = {
    quotes: parsedQuotes.map((quote) => ({
      fromCurrencyCode: USD_BASE_CURRENCY,
      ...quote,
      provider: response.provider,
      model: response.model,
      retrievedAt,
    })),
    provider: response.provider,
    model: response.model,
    retrievedAt,
    cachedAt: Date.now(),
    cacheStatus: 'live',
  };

  await Promise.all(
    result.quotes.map((quote) =>
      ExchangeRateQuote.upsert(quote, { returning: false }),
    ),
  );

  quoteCache.set(cacheKey, result);
  return result;
};

const createExchangeRateQuote = async ({ userId, targetCurrencyCodes }) => {
  const targets = [...new Set(targetCurrencyCodes)].sort();
  await ensureCurrenciesExist([USD_BASE_CURRENCY, ...targets]);
  const recentStoredResult = await findStoredQuotes(
    targets,
    DATABASE_REUSE_TTL_MS,
  );
  let result = recentStoredResult
    ? { ...recentStoredResult, cacheStatus: 'database' }
    : null;

  if (!result) {
    try {
      result = await searchExchangeRates(targets);
    } catch (error) {
      if (error.code !== 'AI_RATE_LIMIT') throw error;

      const fallback = await findStoredQuotes(
        targets,
        RATE_LIMIT_FALLBACK_TTL_MS,
      );
      if (!fallback) throw error;

      result = { ...fallback, cacheStatus: 'rate-limit-fallback' };
    }
  }
  const quoteToken = generateExchangeRateQuoteToken({
    userId,
    quotes: result.quotes,
    provider: result.provider,
    model: result.model,
    retrievedAt: result.retrievedAt,
  });

  return {
    quotes: result.quotes,
    quoteToken,
    provider: result.provider,
    model: result.model,
    retrievedAt: result.retrievedAt,
    cacheStatus: result.cacheStatus,
  };
};

const resolveSignedExchangeRates = ({ userId, financialData }) => {
  const targets = getRequiredExchangeRateTargets(financialData);
  if (targets.length === 0) return [];

  if (!financialData.exchangeRateQuoteToken) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Se requiere una cotización vigente para normalizar los importes a USD.',
      400,
    );
  }

  const decoded = verifyExchangeRateQuoteToken({
    token: financialData.exchangeRateQuoteToken,
    userId,
  });
  const quotes = Array.isArray(decoded.quotes) ? decoded.quotes : [];
  const receivedTargets = quotes
    .map(({ toCurrencyCode }) => toCurrencyCode)
    .sort();

  if (
    targets.length !== receivedTargets.length ||
    targets.some((code, index) => code !== receivedTargets[index]) ||
    quotes.some(
      ({ fromCurrencyCode }) => fromCurrencyCode !== USD_BASE_CURRENCY,
    )
  ) {
    throw new AppError(
      'VALIDATION_ERROR',
      'La cotización no coincide con las divisas de la solicitud.',
      400,
    );
  }

  return quotes;
};

module.exports = {
  createExchangeRateQuote,
  resolveSignedExchangeRates,
};
