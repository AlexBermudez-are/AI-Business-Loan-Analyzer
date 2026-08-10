const createGroqProvider = require('./groqProvider');

const isConfigured = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const shouldUseClaude = () =>
  isConfigured(process.env.CLAUDE_API_KEY) &&
  isConfigured(process.env.CLAUDE_MODEL);

const getAIProvider = () => {
  if (shouldUseClaude()) {
    const createClaudeProvider = require('./claudeProvider');
    return createClaudeProvider();
  }

  return createGroqProvider();
};

module.exports = getAIProvider;
module.exports.shouldUseClaude = shouldUseClaude;
