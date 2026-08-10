const AppError = require('../utils/AppError');

const claudeConfig = Object.freeze({
  apiKey: process.env.CLAUDE_API_KEY,
  model: process.env.CLAUDE_MODEL,
  timeoutMs: 60000,
  maxTokens: 4096,
});

const validateClaudeConfig = (config = claudeConfig) => {
  if (!config.apiKey || !config.model) {
    throw new AppError(
      'AI_PROVIDER_ERROR',
      'Anthropic Claude is not configured.',
      502,
    );
  }
};

module.exports = {
  claudeConfig,
  validateClaudeConfig,
};
