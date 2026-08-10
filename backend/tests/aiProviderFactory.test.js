const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldUseClaude } = require('../providers/aiProviderFactory');

const originalClaudeApiKey = process.env.CLAUDE_API_KEY;
const originalClaudeModel = process.env.CLAUDE_MODEL;

test.afterEach(() => {
  if (originalClaudeApiKey === undefined) {
    delete process.env.CLAUDE_API_KEY;
  } else {
    process.env.CLAUDE_API_KEY = originalClaudeApiKey;
  }

  if (originalClaudeModel === undefined) {
    delete process.env.CLAUDE_MODEL;
  } else {
    process.env.CLAUDE_MODEL = originalClaudeModel;
  }
});

test('selects Claude only when both Claude variables are configured', () => {
  process.env.CLAUDE_API_KEY = 'test-key';
  process.env.CLAUDE_MODEL = 'claude-sonnet-5';
  assert.equal(shouldUseClaude(), true);

  process.env.CLAUDE_MODEL = '';
  assert.equal(shouldUseClaude(), false);

  process.env.CLAUDE_API_KEY = '';
  process.env.CLAUDE_MODEL = 'claude-sonnet-5';
  assert.equal(shouldUseClaude(), false);
});
