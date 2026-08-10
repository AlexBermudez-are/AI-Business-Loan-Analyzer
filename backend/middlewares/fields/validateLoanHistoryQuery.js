const { z } = require('zod');
const AppError = require('../../utils/AppError');

const historyQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(20).default(3),
    cursor: z.string().trim().min(1).max(500).optional(),
  })
  .strict();

exports.validateLoanHistoryQuery = (req, _res, next) => {
  const result = historyQuerySchema.safeParse(req.query);

  if (!result.success) {
    return next(
      new AppError('VALIDATION_ERROR', 'The history query is invalid.', 400, {
        fields: result.error.issues.map((issue) => ({
          field: issue.path.join('.') || 'query',
          message: issue.message,
        })),
      }),
    );
  }

  req.query = result.data;
  return next();
};
