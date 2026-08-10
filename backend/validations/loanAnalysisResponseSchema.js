const { z } = require('zod');
const AppError = require('../utils/AppError');

const listItemSchema = z.string().trim().min(1).max(300);

const loanAnalysisResponseSchema = z
  .object({
    financialHealth: z.enum(['strong', 'moderate', 'weak']),
    riskLevel: z.enum(['low', 'medium', 'high']),
    summary: z.string().trim().min(1).max(1200),
    positiveFactors: z.array(listItemSchema).max(6),
    riskFactors: z.array(listItemSchema).max(6),
    followUpQuestions: z.array(listItemSchema).max(6),
  })
  .strict();

const loanAnalysisJsonSchema = Object.freeze({
  type: 'object',
  properties: {
    financialHealth: {
      type: 'string',
      enum: ['strong', 'moderate', 'weak'],
    },
    riskLevel: {
      type: 'string',
      enum: ['low', 'medium', 'high'],
    },
    summary: { type: 'string' },
    positiveFactors: {
      type: 'array',
      items: { type: 'string' },
    },
    riskFactors: {
      type: 'array',
      items: { type: 'string' },
    },
    followUpQuestions: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: [
    'financialHealth',
    'riskLevel',
    'summary',
    'positiveFactors',
    'riskFactors',
    'followUpQuestions',
  ],
  additionalProperties: false,
});

const unique = (values) => [...new Set(values)];

const spanishSignals = new Set([
  'al',
  'actual',
  'alto',
  'bajo',
  'caja',
  'como',
  'con',
  'de',
  'debe',
  'deuda',
  'del',
  'el',
  'en',
  'empresa',
  'es',
  'esta',
  'financiera',
  'financiero',
  'flujo',
  'gastos',
  'ingresos',
  'la',
  'las',
  'los',
  'mensual',
  'monto',
  'negocio',
  'para',
  'pero',
  'por',
  'positivo',
  'que',
  'riesgo',
  'se',
  'sin',
  'solicitud',
  'solicitado',
  'son',
  'su',
  'una',
  'y',
]);

const englishSignals = new Set([
  'and',
  'are',
  'business',
  'cash',
  'debt',
  'expenses',
  'flow',
  'for',
  'from',
  'has',
  'how',
  'is',
  'loan',
  'monthly',
  'positive',
  'requested',
  'revenue',
  'risk',
  'the',
  'this',
  'to',
  'what',
  'with',
]);

const getLanguageScore = (text) => {
  const words = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .match(/[a-z]+/g);

  return (words || []).reduce(
    (score, word) => ({
      spanish: score.spanish + Number(spanishSignals.has(word)),
      english: score.english + Number(englishSignals.has(word)),
    }),
    { spanish: 0, english: 0 },
  );
};

const isAnalysisInSpanish = (analysis) => {
  const strings = [
    analysis.summary,
    ...analysis.positiveFactors,
    ...analysis.riskFactors,
    ...analysis.followUpQuestions,
  ];

  const scores = strings.map(getLanguageScore);
  const total = scores.reduce(
    (result, score) => ({
      spanish: result.spanish + score.spanish,
      english: result.english + score.english,
    }),
    { spanish: 0, english: 0 },
  );

  return (
    total.spanish >= 6 &&
    total.spanish > total.english &&
    scores.every(
      (score) => score.english === 0 || score.spanish > score.english,
    )
  );
};

const parseLoanAnalysisResponse = (content) => {
  let parsedContent;

  try {
    parsedContent = JSON.parse(content);
  } catch (_error) {
    throw new AppError(
      'AI_INVALID_RESPONSE',
      'The AI provider returned an invalid response.',
      502,
    );
  }

  const result = loanAnalysisResponseSchema.safeParse(parsedContent);

  if (!result.success) {
    throw new AppError(
      'AI_INVALID_RESPONSE',
      'The AI provider returned an incompatible response.',
      502,
    );
  }

  if (!isAnalysisInSpanish(result.data)) {
    throw new AppError(
      'AI_INVALID_RESPONSE',
      'The AI provider returned an analysis in an unsupported language.',
      502,
    );
  }

  return {
    ...result.data,
    positiveFactors: unique(result.data.positiveFactors),
    riskFactors: unique(result.data.riskFactors),
    followUpQuestions: unique(result.data.followUpQuestions),
  };
};

module.exports = {
  isAnalysisInSpanish,
  loanAnalysisJsonSchema,
  loanAnalysisResponseSchema,
  parseLoanAnalysisResponse,
};
