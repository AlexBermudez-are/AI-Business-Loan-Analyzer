const AppError = require('../utils/AppError');

const parseNumber = (value, fallback) => {
  if (value === undefined || value === '') return fallback;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const groqConfig = Object.freeze({
  apiKey: process.env.GROQ_API_KEY,
  model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
  temperature: parseNumber(process.env.GROQ_TEMPERATURE, 0.1),
  timeoutMs: parseNumber(process.env.GROQ_TIMEOUT_MS, 20000),
  maxCompletionTokens: parseNumber(
    process.env.GROQ_MAX_COMPLETION_TOKENS,
    4096,
  ),
});

const validateGroqConfig = (config = groqConfig) => {
  if (!config.apiKey) {
    throw new AppError('AI_PROVIDER_ERROR', 'Groq is not configured.', 502);
  }

  if (!config.model) {
    throw new AppError(
      'AI_PROVIDER_ERROR',
      'The Groq configuration is invalid.',
      500,
    );
  }

  if (config.temperature < 0 || config.temperature > 2) {
    throw new AppError(
      'AI_PROVIDER_ERROR',
      'The Groq configuration is invalid.',
      500,
    );
  }

  if (config.timeoutMs <= 0) {
    throw new AppError(
      'AI_PROVIDER_ERROR',
      'The Groq configuration is invalid.',
      500,
    );
  }

  if (config.maxCompletionTokens < 1000) {
    throw new AppError(
      'AI_PROVIDER_ERROR',
      'The Groq configuration is invalid.',
      500,
    );
  }
};

module.exports = {
  groqConfig,
  validateGroqConfig,
};
