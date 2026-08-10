const loanAnalysisService = require('../services/loanAnalysisService');

exports.analyzeLoanApplication = async (req, res, next) => {
  try {
    const loanApplication = await loanAnalysisService.analyzeLoanApplication({
      userId: req.user.id,
      payload: req.body,
    });

    return res.status(201).json({
      message: 'Loan pre-analysis completed.',
      loanApplication,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getLoanApplicationById = async (req, res, next) => {
  try {
    const loanApplication = await loanAnalysisService.getLoanApplicationById({
      id: req.params.id,
      userId: req.user.id,
    });

    return res.status(200).json({ loanApplication });
  } catch (error) {
    return next(error);
  }
};

exports.getLatestLoanApplication = async (req, res, next) => {
  try {
    const loanApplication = await loanAnalysisService.getLatestLoanApplication({
      userId: req.user.id,
    });

    return res.status(200).json({ loanApplication });
  } catch (error) {
    return next(error);
  }
};

exports.getLoanAnalysisHistory = async (req, res, next) => {
  try {
    const history = await loanAnalysisService.getLoanAnalysisHistory({
      userId: req.user.id,
      limit: req.query.limit,
      cursor: req.query.cursor,
    });

    return res.status(200).json({ history });
  } catch (error) {
    return next(error);
  }
};
