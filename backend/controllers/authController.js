const bcrypt = require('bcrypt');
const { User } = require('../models');
const generateAccessToken = require('../token/generateAccessToken');
const AppError = require('../utils/AppError');

const buildAuthResponse = (user, message) => ({
  message,
  accessToken: generateAccessToken(user),
  tokenType: 'Bearer',
  expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  user: {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
  },
});

exports.register = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      throw new AppError(
        'RESOURCE_CONFLICT',
        'An account with this email already exists.',
        409,
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
    });

    return res.status(201).json(buildAuthResponse(user, 'Account created.'));
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError(
        'AUTHENTICATION_ERROR',
        'Invalid email or password.',
        401,
      );
    }

    return res.status(200).json(buildAuthResponse(user, 'Login successful.'));
  } catch (error) {
    return next(error);
  }
};
