const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseLoanAnalysisResponse,
} = require('../validations/loanAnalysisResponseSchema');

test('parses, trims, and deduplicates a valid analysis', () => {
  const analysis = parseLoanAnalysisResponse(
    JSON.stringify({
      financialHealth: 'moderate',
      riskLevel: 'medium',
      summary:
        '  La empresa mantiene un flujo de caja positivo frente al monto solicitado.  ',
      positiveFactors: ['Flujo de caja positivo', 'Flujo de caja positivo'],
      riskFactors: ['El monto solicitado supera los ingresos mensuales'],
      followUpQuestions: [
        '¿Cómo se financiará la siguiente etapa del negocio?',
      ],
    }),
  );

  assert.equal(
    analysis.summary,
    'La empresa mantiene un flujo de caja positivo frente al monto solicitado.',
  );
  assert.deepEqual(analysis.positiveFactors, ['Flujo de caja positivo']);
});

test('rejects an otherwise valid analysis written in English', () => {
  assert.throws(
    () =>
      parseLoanAnalysisResponse(
        JSON.stringify({
          financialHealth: 'moderate',
          riskLevel: 'medium',
          summary:
            'The business has positive monthly cash flow and stable revenue.',
          positiveFactors: ['Positive cash flow and controlled expenses'],
          riskFactors: [
            'The requested loan is high compared with monthly revenue',
          ],
          followUpQuestions: [
            'How will the business repay the requested loan?',
          ],
        }),
      ),
    (error) => error.code === 'AI_INVALID_RESPONSE',
  );
});

test('rejects incompatible enum values', () => {
  assert.throws(
    () =>
      parseLoanAnalysisResponse(
        JSON.stringify({
          financialHealth: 'excellent',
          riskLevel: 'medium',
          summary: 'Summary',
          positiveFactors: [],
          riskFactors: [],
          followUpQuestions: [],
        }),
      ),
    (error) => error.code === 'AI_INVALID_RESPONSE',
  );
});
