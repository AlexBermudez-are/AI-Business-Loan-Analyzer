const enabled = process.env.NODE_ENV !== 'test';

const write = (stream, level, event, metadata = {}) => {
  if (!enabled) return;
  stream.write(
    `${JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      event,
      ...metadata,
    })}\n`,
  );
};

module.exports = {
  info: (event, metadata) => write(process.stdout, 'info', event, metadata),
  error: (event, metadata) => write(process.stderr, 'error', event, metadata),
};
