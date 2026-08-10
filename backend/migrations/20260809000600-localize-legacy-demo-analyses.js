'use strict';

const legacyDemoAnalyses = [
  {
    oldSummary:
      'BMT Precision Foods 2026 has a healthy positive monthly cash flow of $28,000 on $85,000 revenue, with an expense ratio of 0.67 and existing debt at 25.9% of revenue. The requested $110,000 loan is 1.29 times monthly revenue, which is a sizable amount but could be supported by current cash flow if debt service is manageable.',
    oldPositiveFactors: [
      'Positive net monthly cash flow of $28,000',
      'Expense ratio of 0.67 indicates efficient cost control',
      'Existing debt represents only 25.9% of monthly revenue',
      'Clear growth plan to expand regional wholesale distribution',
    ],
    oldRiskFactors: [
      'Requested loan amount is 1.29 times monthly revenue, a high leverage ratio',
      'Existing debt already consumes 25.9% of revenue',
      'Potential risk in capital expenditure for automated packaging equipment',
      'Expansion into new distribution channels may face market and operational risks',
    ],
    oldFollowUpQuestions: [
      'What is the projected debt service coverage ratio after the loan is taken?',
      'Can you provide a detailed breakdown of the equipment purchase cost and expected ROI?',
      'What is the timeline and strategy for expanding regional wholesale distribution?',
      'Do you have contingency plans if equipment or distribution expansion underperforms?',
      'How will the loan be repaid and what is the expected repayment schedule?',
    ],
    summary:
      'BMT Precision Foods 2026 mantiene un flujo de caja mensual positivo de 28.000 USD sobre ingresos de 85.000 USD, con un ratio de gastos de 0,67 y una deuda existente equivalente al 25,9 % de los ingresos. El préstamo solicitado de 110.000 USD representa 1,29 veces los ingresos mensuales; es un monto significativo, aunque el flujo actual podría respaldarlo si el servicio de la deuda es manejable.',
    positiveFactors: [
      'Flujo de caja mensual neto positivo de 28.000 USD',
      'El ratio de gastos de 0,67 refleja un control de costos eficiente',
      'La deuda existente representa sólo el 25,9 % de los ingresos mensuales',
      'Plan de crecimiento claro para ampliar la distribución mayorista regional',
    ],
    riskFactors: [
      'El monto solicitado equivale a 1,29 veces los ingresos mensuales, lo que implica un apalancamiento elevado',
      'La deuda existente ya representa el 25,9 % de los ingresos',
      'La inversión de capital en equipos de envasado automatizado presenta riesgo de ejecución',
      'La expansión hacia nuevos canales de distribución puede afrontar riesgos comerciales y operativos',
    ],
    followUpQuestions: [
      '¿Cuál será el ratio proyectado de cobertura del servicio de la deuda después de recibir el préstamo?',
      '¿Puede proporcionar un desglose del costo del equipamiento y del retorno esperado de la inversión?',
      '¿Cuál es el cronograma y la estrategia para ampliar la distribución mayorista regional?',
      '¿Qué planes de contingencia existen si el equipamiento o la expansión rinden por debajo de lo previsto?',
      '¿Cuál será el cronograma de pagos y cómo se financiarán las cuotas?',
    ],
  },
  {
    oldSummary:
      'R�o Plata Panader�a SAS shows positive cash flow and manageable expenses but seeks a loan amount exceeding its monthly revenue, indicating potential repayment strain.',
    oldPositiveFactors: [
      'Positive net monthly cash flow of 28,000',
      'Expense ratio of 0.67 indicates efficient cost control',
      'Existing debt represents only 25.9% of monthly revenue',
    ],
    oldRiskFactors: [
      'Requested loan amount is 1.29 times monthly revenue',
      'Limited operating history of 6 years',
      'Potential cash flow pressure from large capital outlay',
    ],
    oldFollowUpQuestions: [
      'What is the projected monthly cash flow after the loan is repaid?',
      'What collateral or guarantees can be offered?',
      'How will the new oven and wholesale expansion impact revenue projections?',
      'What is the repayment schedule and interest rate being considered?',
      'Does the company have a contingency plan for revenue fluctuations?',
    ],
    summary:
      'Río Plata Panadería SAS presenta un flujo de caja positivo y gastos manejables, pero solicita un préstamo que supera sus ingresos mensuales, lo que podría generar presión sobre la capacidad de pago.',
    positiveFactors: [
      'Flujo de caja mensual neto positivo de 28.000 USD',
      'El ratio de gastos de 0,67 refleja un control de costos eficiente',
      'La deuda existente representa sólo el 25,9 % de los ingresos mensuales',
    ],
    riskFactors: [
      'El monto solicitado equivale a 1,29 veces los ingresos mensuales',
      'El negocio cuenta con un historial operativo de seis años',
      'La importante inversión de capital puede ejercer presión sobre el flujo de caja',
    ],
    followUpQuestions: [
      '¿Cuál será el flujo de caja mensual proyectado después de asumir el préstamo?',
      '¿Qué garantías o respaldos puede ofrecer la empresa?',
      '¿Cómo impactarán el nuevo horno y la expansión mayorista en las proyecciones de ingresos?',
      '¿Qué cronograma de pagos y tasa de interés se están considerando?',
      '¿La empresa cuenta con un plan de contingencia ante fluctuaciones de ingresos?',
    ],
    correctedBusinessName: 'Río Plata Panadería SAS',
    oldBusinessName: 'R�o Plata Panader�a SAS',
  },
];

const updateAnalysis = async (
  queryInterface,
  transaction,
  { matchSummary, summary, positiveFactors, riskFactors, followUpQuestions },
) => {
  await queryInterface.sequelize.query(
    `
      UPDATE "LoanAnalyses"
      SET
        "summary" = :summary,
        "positiveFactors" = CAST(:positiveFactors AS jsonb),
        "riskFactors" = CAST(:riskFactors AS jsonb),
        "followUpQuestions" = CAST(:followUpQuestions AS jsonb),
        "updatedAt" = NOW()
      WHERE "summary" = :matchSummary
    `,
    {
      replacements: {
        matchSummary,
        summary,
        positiveFactors: JSON.stringify(positiveFactors),
        riskFactors: JSON.stringify(riskFactors),
        followUpQuestions: JSON.stringify(followUpQuestions),
      },
      transaction,
    },
  );
};

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const analysis of legacyDemoAnalyses) {
        if (analysis.correctedBusinessName) {
          await queryInterface.sequelize.query(
            `
              UPDATE "Businesses" AS business
              SET "name" = :correctedBusinessName, "updatedAt" = NOW()
              FROM "LoanApplications" AS application
              INNER JOIN "LoanAnalyses" AS analysis
                ON analysis."loanApplicationId" = application."id"
              WHERE application."businessId" = business."id"
                AND analysis."summary" = :oldSummary
            `,
            {
              replacements: {
                correctedBusinessName: analysis.correctedBusinessName,
                oldSummary: analysis.oldSummary,
              },
              transaction,
            },
          );
        }

        await updateAnalysis(queryInterface, transaction, {
          matchSummary: analysis.oldSummary,
          ...analysis,
        });
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const analysis of legacyDemoAnalyses) {
        await updateAnalysis(queryInterface, transaction, {
          matchSummary: analysis.summary,
          summary: analysis.oldSummary,
          positiveFactors: analysis.oldPositiveFactors,
          riskFactors: analysis.oldRiskFactors,
          followUpQuestions: analysis.oldFollowUpQuestions,
        });

        if (analysis.oldBusinessName) {
          await queryInterface.sequelize.query(
            `
              UPDATE "Businesses" AS business
              SET "name" = :oldBusinessName, "updatedAt" = NOW()
              FROM "LoanApplications" AS application
              INNER JOIN "LoanAnalyses" AS loan_analysis
                ON loan_analysis."loanApplicationId" = application."id"
              WHERE application."businessId" = business."id"
                AND loan_analysis."summary" = :oldSummary
            `,
            {
              replacements: {
                oldBusinessName: analysis.oldBusinessName,
                oldSummary: analysis.oldSummary,
              },
              transaction,
            },
          );
        }
      }
    });
  },
};
