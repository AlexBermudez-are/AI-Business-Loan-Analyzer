const GroqModule = require('groq-sdk');
const { groqConfig, validateGroqConfig } = require('../config/groq');
const AppError = require('../utils/AppError');
const {
  loanAnalysisJsonSchema,
} = require('../validations/loanAnalysisResponseSchema');
const {
  exchangeRateSearchJsonSchema,
  parseExchangeRateSearchResponse,
} = require('../validations/exchangeRateResponseSchema');
const buildExchangeRateSearchPrompt = require('../prompts/exchangeRateSearch.prompt');

const Groq = GroqModule.default || GroqModule;

const getRetryAfter = (error) => {
  if (typeof error.headers?.get === 'function') {
    return error.headers.get('retry-after') || undefined;
  }

  return error.headers?.['retry-after'];
};

const getRateLimitDetails = (error) => {
  const retryAfterValue = getRetryAfter(error);
  const retryAfter = Number.parseInt(retryAfterValue, 10);
  const providerMessage =
    error.error?.error?.message || error.error?.message || error.message || '';
  const limitType = providerMessage.match(
    /\b(ITPM|OTPM|TPM|TPD|RPM|RPD)\b/i,
  )?.[1];

  return {
    ...(Number.isFinite(retryAfter) && retryAfter > 0 ? { retryAfter } : {}),
    ...(limitType ? { limitType: limitType.toUpperCase() } : {}),
  };
};

const createGroqProvider = (options = {}) => {
  const config = options.config || groqConfig;
  validateGroqConfig(config);

  const client =
    options.client ||
    new Groq({
      apiKey: config.apiKey,
      maxRetries: 0,
      timeout: config.timeoutMs,
      logLevel: 'off',
    });

  return {
    name: 'groq',
    model: config.model,

    async generateLoanAnalysis({ systemPrompt, userPrompt }) {
      try {
        const completion = await client.chat.completions.create({
          model: config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: config.temperature,
          max_completion_tokens: config.maxCompletionTokens,
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'loan_analysis',
              strict: true,
              schema: loanAnalysisJsonSchema,
            },
          },
          reasoning_effort: 'medium',
          reasoning_format: 'hidden',
          stream: false,
        });

        const content = completion.choices?.[0]?.message?.content;
        if (typeof content !== 'string' || !content.trim()) {
          throw new AppError(
            'AI_INVALID_RESPONSE',
            'The AI provider returned an empty response.',
            502,
          );
        }

        return {
          content,
          provider: 'groq',
          model: completion.model || config.model,
        };
      } catch (error) {
        if (error instanceof AppError) throw error;

        if (error.status === 429 || error.name === 'RateLimitError') {
          throw new AppError(
            'AI_RATE_LIMIT',
            'The AI provider rate limit was reached.',
            429,
            getRateLimitDetails(error),
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
        const researchCompletion = await client.chat.completions.create({
          model: config.model,
          messages: [{ role: 'user', content: prompts.groqResearchPrompt }],
          tools: [{ type: 'browser_search' }],
          tool_choice: 'required',
          reasoning_effort: 'low',
          max_completion_tokens: 1200,
          temperature: 0.2,
          stream: false,
        });
        const researchContent =
          researchCompletion.choices?.[0]?.message?.content;

        if (typeof researchContent !== 'string' || !researchContent.trim()) {
          throw new AppError(
            'AI_INVALID_RESPONSE',
            'The AI provider did not return a web-sourced exchange quote.',
            502,
          );
        }

        try {
          parseExchangeRateSearchResponse(researchContent, targetCurrencyCodes);
          return {
            content: researchContent,
            provider: 'groq',
            model: researchCompletion.model || config.model,
          };
        } catch (error) {
          if (error.code !== 'AI_INVALID_RESPONSE') throw error;
        }

        const completion = await client.chat.completions.create({
          model: config.model,
          messages: [
            {
              role: 'system',
              content:
                'Transforma las notas de búsqueda en el JSON solicitado. Usa sólo los datos y URLs presentes en las notas. No agregues explicaciones.',
            },
            {
              role: 'user',
              content: `Monedas requeridas: ${targetCurrencyCodes.join(', ')}.\nNotas de búsqueda:\n${researchContent}`,
            },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'exchange_rate_search',
              strict: true,
              schema: exchangeRateSearchJsonSchema,
            },
          },
          reasoning_effort: 'low',
          reasoning_format: 'hidden',
          max_completion_tokens: 1000,
          temperature: 0.1,
          stream: false,
        });
        const content = completion.choices?.[0]?.message?.content;

        if (typeof content !== 'string' || !content.trim()) {
          throw new AppError(
            'AI_INVALID_RESPONSE',
            'The AI provider returned invalid exchange-rate data.',
            502,
          );
        }

        return {
          content,
          provider: 'groq',
          model: completion.model || config.model,
        };
      } catch (error) {
        if (error instanceof AppError) throw error;

        if (error.status === 429 || error.name === 'RateLimitError') {
          throw new AppError(
            'AI_RATE_LIMIT',
            'The AI provider rate limit was reached.',
            429,
            getRateLimitDetails(error),
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

module.exports = createGroqProvider;
module.exports.getRateLimitDetails = getRateLimitDetails;
