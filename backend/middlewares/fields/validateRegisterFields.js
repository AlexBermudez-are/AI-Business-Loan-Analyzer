const { z } = require('zod');
const AppError = require('../../utils/AppError');

const registerSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((email) => email.toLowerCase()),
    password: z
      .string()
      .min(8)
      .max(128)
      .regex(/[a-z]/, 'Password must include a lowercase letter.')
      .regex(/[A-Z]/, 'Password must include an uppercase letter.')
      .regex(/[0-9]/, 'Password must include a number.'),
  })
  .strict();

exports.validateRegisterFields = (req, _res, next) => {
  const result = registerSchema.safeParse(req.body);

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
