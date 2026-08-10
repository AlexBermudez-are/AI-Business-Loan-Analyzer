const AnthropicModule = require('@anthropic-ai/sdk');
const { claudeConfig, validateClaudeConfig } = require('../config/claude');
const AppError = require('../utils/AppError');
const {
  loanAnalysisJsonSchema,
} = require('../validations/loanAnalysisResponseSchema');
const {
  exchangeRateSearchJsonSchema,
} = require('../validations/exchangeRateResponseSchema');
const buildExchangeRateSearchPrompt = require('../prompts/exchangeRateSearch.prompt');

const Anthropic = AnthropicModule.default || AnthropicModule;

const getRetryAfter = (error) => {
  if (typeof error.headers?.get === 'function') {
    return error.headers.get('retry-after') || undefined;
  }

  return error.headers?.['retry-after'];
};

const createClaudeProvider = (options = {}) => {
  const config = options.config || claudeConfig;
  validateClaudeConfig(config);

  const client =
    options.client ||
    new Anthropic({
      apiKey: config.apiKey,
      maxRetries: 0,
      timeout: config.timeoutMs,
      logLevel: 'off',
    });

  return {
    name: 'anthropic',
    model: config.model,

    async generateLoanAnalysis({ systemPrompt, userPrompt }) {
      try {
        const message = await client.messages.create({
          model: config.model,
          max_tokens: config.maxTokens,
          thinking: { type: 'disabled' },
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
          output_config: {
            format: {
              type: 'json_schema',
              schema: loanAnalysisJsonSchema,
            },
          },
        });

        if (message.stop_reason === 'max_tokens') {
          throw new AppError(
            'AI_INVALID_RESPONSE',
            'The AI provider response was truncated.',
            502,
          );
        }

        const content = (Array.isArray(message.content) ? message.content : [])
          .filter((block) => block.type === 'text')
          .map((block) => block.text)
          .join('\n')
          .trim();

        if (!content) {
          throw new AppError(
            'AI_INVALID_RESPONSE',
            'The AI provider returned an empty response.',
            502,
          );
        }

        return {
          content,
          provider: 'anthropic',
          model: message.model || config.model,
        };
      } catch (error) {
        if (error instanceof AppError) throw error;

        if (error.status === 429 || error.name === 'RateLimitError') {
          throw new AppError(
            'AI_RATE_LIMIT',
            'The AI provider rate limit was reached.',
            429,
            { retryAfter: getRetryAfter(error) },
          );
        }

        if (error.name === 'APIConnectionTimeoutError') {
          throw new AppError(
            'AI_TIMEOUT',
            'The AI provider did not respond in time.',
            504,
          );
        }

        throw new AppError(
          'AI_PROVIDER_ERROR',
          'The AI provider request failed.',
          502,
        );
      }
    },

    async searchExchangeRates({ targetCurrencyCodes }) {
      const prompts = buildExchangeRateSearchPrompt(targetCurrencyCodes);

      try {
        const message = await client.messages.create({
          model: config.model,
          max_tokens: config.maxTokens,
          thinking: { type: 'disabled' },
          system: prompts.systemPrompt,
          messages: [{ role: 'user', content: prompts.userPrompt }],
          tools: [
            {
              type: 'web_search_20250305',
              name: 'web_search',
              max_uses: Math.min(targetCurrencyCodes.length, 5),
            },
          ],
          output_config: {
            format: {
              type: 'json_schema',
              schema: exchangeRateSearchJsonSchema,
            },
          },
        });

        if (message.stop_reason === 'max_tokens') {
          throw new AppError(
            'AI_INVALID_RESPONSE',
            'The AI provider response was truncated.',
            502,
          );
        }

        const blocks = Array.isArray(message.content) ? message.content : [];
        const usedWebSearch = blocks.some(
          (block) =>
            (block.type === 'server_tool_use' && block.name === 'web_search') ||
            block.type === 'web_search_tool_result',
        );
        const content = blocks
          .filter((block) => block.type === 'text')
          .map((block) => block.text)
          .join('\n')
          .trim();

        if (!usedWebSearch || !content) {
          throw new AppError(
            'AI_INVALID_RESPONSE',
            'The AI provider did not return a web-sourced exchange quote.',
            502,
          );
        }

        return {
          content,
          provider: 'anthropic',
          model: message.model || config.model,
        };
      } catch (error) {
        if (error instanceof AppError) throw error;

        if (error.status === 429 || error.name === 'RateLimitError') {
          throw new AppError(
            'AI_RATE_LIMIT',
            'The AI provider rate limit was reached.',
            429,
            { retryAfter: getRetryAfter(error) },
          );
        }

        if (error.name === 'APIConnectionTimeoutError') {
          throw new AppError(
            'AI_TIMEOUT',
            'The AI provider did not respond in time.',
            504,
          );
        }

        throw new AppError(
          'AI_PROVIDER_ERROR',
          'The exchange-rate search failed.',
          502,
        );
      }
    },
  };
};

module.exports = createClaudeProvider;
