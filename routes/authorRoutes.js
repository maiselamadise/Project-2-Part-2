const express = require('express');
const router = express.Router();
const {
  getAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor,
} = require('../controllers/authorController');
const {
  validate,
  mongoIdParam,
  authorCreateRules,
  authorUpdateRules,
} = require('../middleware/validators');
const { isAuthenticated } = require('../middleware/authenticate');

router.route('/').get(getAuthors).post(isAuthenticated, authorCreateRules, validate, createAuthor);

router
  .route('/:id')
  .get(mongoIdParam, validate, getAuthorById)
  .put(isAuthenticated, [...mongoIdParam, ...authorUpdateRules], validate, updateAuthor)
  .delete(isAuthenticated, mongoIdParam, validate, deleteAuthor);

module.exports = router;
