const { body, param, validationResult } = require('express-validator');

// Runs after the rule chains below; returns 400 with all messages if any rule failed
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors
        .array()
        .map((e) => e.msg)
        .join(', '),
    });
  }
  next();
};

const mongoIdParam = [
  param('id').isMongoId().withMessage('Invalid ID format'),
];

const bookCreateRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('author').isMongoId().withMessage('A valid author ID is required'),
  body('isbn').trim().notEmpty().withMessage('ISBN is required'),
  body('genre').trim().notEmpty().withMessage('Genre is required'),
  body('publishedYear')
    .notEmpty()
    .withMessage('Published year is required')
    .isInt({ min: 1000, max: new Date().getFullYear() })
    .withMessage('Published year must be a valid year'),
  body('pages')
    .notEmpty()
    .withMessage('Pages is required')
    .isInt({ min: 1 })
    .withMessage('Pages must be a positive integer'),
  body('rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),
  body('description').optional().trim(),
  body('inStock').optional().isBoolean().withMessage('inStock must be true or false'),
];

// PUT allows partial updates, so fields are optional but still validated if present
const bookUpdateRules = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('author').optional().isMongoId().withMessage('A valid author ID is required'),
  body('isbn').optional().trim().notEmpty().withMessage('ISBN cannot be empty'),
  body('genre').optional().trim().notEmpty().withMessage('Genre cannot be empty'),
  body('publishedYear')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() })
    .withMessage('Published year must be a valid year'),
  body('pages').optional().isInt({ min: 1 }).withMessage('Pages must be a positive integer'),
  body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
  body('description').optional().trim(),
  body('inStock').optional().isBoolean().withMessage('inStock must be true or false'),
];

const authorCreateRules = [
  body('name').trim().notEmpty().withMessage('Author name is required'),
  body('bio').optional().trim(),
  body('birthYear')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() })
    .withMessage('Birth year must be a valid year'),
  body('nationality').optional().trim(),
  body('website').optional({ values: 'falsy' }).trim().isURL().withMessage('Website must be a valid URL'),
];

const authorUpdateRules = [
  body('name').optional().trim().notEmpty().withMessage('Author name cannot be empty'),
  body('bio').optional().trim(),
  body('birthYear')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() })
    .withMessage('Birth year must be a valid year'),
  body('nationality').optional().trim(),
  body('website').optional({ values: 'falsy' }).trim().isURL().withMessage('Website must be a valid URL'),
];

module.exports = {
  validate,
  mongoIdParam,
  bookCreateRules,
  bookUpdateRules,
  authorCreateRules,
  authorUpdateRules,
};
