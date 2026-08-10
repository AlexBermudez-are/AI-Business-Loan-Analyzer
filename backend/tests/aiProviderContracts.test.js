const test = require('node:test');
const assert = require('node:assert/strict');
const createClaudeProvider = require('../providers/claudeProvider');
const createGroqProvider = require('../providers/groqProvider');
const { getRateLimitDetails } = require('../providers/groqProvider');
const {
  parseLoanAnalysisResponse,
} = require('../validations/loanAnalysisResponseSchema');

const analysis = {
  financialHealth: 'moderate',
  riskLevel: 'medium',
  summary:
    'La empresa mantiene flujo de caja positivo, aunque debe revisar la carga mensual de deuda y la cotización aplicada.',
  positiveFactors: ['Los ingresos mensuales superan los gastos normalizados.'],
  riskFactors: ['La deuda mensual reduce la capacidad financiera disponible.'],
  followUpQuestions: ['¿Cuál es el plazo previsto para el nuevo préstamo?'],
};
const content = JSON.stringify(analysis);
const exchangeRateContent = JSON.stringify({
  quotes: [
    {
      toCurrencyCode: 'ARS',
      rate: 1350,
      quotedAt: '2026-08-10',
      sourceName: 'Banco Central',
      sourceUrl: 'https://example.com/usd-ars',
    },
  ],
});

test('normalizes the documented Claude Messages response contract', async () => {
  let request;
  const client = {
    messages: {
      create: async (parameters) => {
        request = parameters;
        const isExchangeSearch = Array.isArray(parameters.tools);
        return {
          model: 'claude-sonnet-5',
          stop_reason: 'end_turn',
          content: isExchangeSearch
            ? [
                {
                  type: 'server_tool_use',
                  name: 'web_search',
                  id: 'search_1',
                },
                { type: 'web_search_tool_result', tool_use_id: 'search_1' },
                { type: 'text', text: exchangeRateContent },
              ]
            : [
                { type: 'thinking', thinking: 'internal' },
                { type: 'text', text: content },
              ],
        };
      },
    },
  };
  const provider = createClaudeProvider({
    client,
    config: {
      apiKey: 'test-key',
      model: 'claude-sonnet-5',
      timeoutMs: 1000,
      maxTokens: 4096,
    },
  });

  const response = await provider.generateLoanAnalysis({
    systemPrompt: 'system',
    userPrompt: 'user',
  });

  assert.equal(request.system, 'system');
  assert.deepEqual(request.messages, [{ role: 'user', content: 'user' }]);
  assert.deepEqual(request.thinking, { type: 'disabled' });
  assert.equal(request.temperature, undefined);
  assert.equal(request.output_config.format.type, 'json_schema');
  assert.equal(response.provider, 'anthropic');
  assert.deepEqual(parseLoanAnalysisResponse(response.content), analysis);

  const exchangeResponse = await provider.searchExchangeRates({
    targetCurrencyCodes: ['ARS'],
  });
  assert.equal(request.tools[0].type, 'web_search_20250305');
  assert.equal(exchangeResponse.content, exchangeRateContent);
});

test('normalizes Groq into the same persisted analysis contract', async () => {
  const requests = [];
  const client = {
    chat: {
      completions: {
        create: async (parameters) => {
          requests.push(parameters);
          return {
            model: 'openai/gpt-oss-20b',
            choices: [
              {
                message: {
                  content: parameters.tools
                    ? 'Research notes with current rates and source URLs.'
                    : parameters.messages?.[1]?.content?.includes(
                          'Notas de búsqueda',
                        )
                      ? exchangeRateContent
                      : content,
                },
              },
            ],
          };
        },
      },
    },
  };
  const provider = createGroqProvider({
    client,
    config: {
      apiKey: 'test-key',
      model: 'openai/gpt-oss-20b',
      temperature: 0.1,
      timeoutMs: 1000,
      maxCompletionTokens: 1000,
    },
  });

  const response = await provider.generateLoanAnalysis({
    systemPrompt: 'system',
    userPrompt: 'user',
  });

  assert.equal(response.provider, 'groq');
  assert.deepEqual(parseLoanAnalysisResponse(response.content), analysis);

  const exchangeResponse = await provider.searchExchangeRates({
    targetCurrencyCodes: ['ARS'],
  });
  assert.deepEqual(requests[1].tools, [{ type: 'browser_search' }]);
  assert.equal(requests[1].tool_choice, 'required');
  assert.equal(
    requests[2].response_format.json_schema.name,
    'exchange_rate_search',
  );
  assert.equal(exchangeResponse.content, exchangeRateContent);
});

test('sanitizes Groq rate-limit metadata for the frontend', () => {
  const details = getRateLimitDetails({
    message:
      'Rate limit reached on tokens per day (TPD) for an internal organization.',
    headers: { 'retry-after': '247' },
  });

  assert.deepEqual(details, { retryAfter: 247, limitType: 'TPD' });
});
