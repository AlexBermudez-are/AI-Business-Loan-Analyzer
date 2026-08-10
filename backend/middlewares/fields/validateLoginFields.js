const { z } = require('zod');
const AppError = require('../../utils/AppError');

const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((email) => email.toLowerCase()),
    password: z.string().min(1).max(128),
  })
  .strict();

exports.validateLoginFields = (req, _res, next) => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    return next(
      new AppError('VALIDATION_ERROR', 'The request payload is invalid.', 400, {
        fields: result.error.issues.map((issue) => ({
          field: issue.path.join('.') || 'body',
          message: issue.message,
        })),
      }),
    );
  }

  req.body = result.data;
  return next();
};
