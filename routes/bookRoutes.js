const express = require('express');
const router = express.Router();
const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} = require('../controllers/bookController');
const {
  validate,
  mongoIdParam,
  bookCreateRules,
  bookUpdateRules,
} = require('../middleware/validators');
const { isAuthenticated } = require('../middleware/authenticate');

router.route('/').get(getBooks).post(isAuthenticated, bookCreateRules, validate, createBook);

router
  .route('/:id')
  .get(mongoIdParam, validate, getBookById)
  .put(isAuthenticated, [...mongoIdParam, ...bookUpdateRules], validate, updateBook)
  .delete(isAuthenticated, mongoIdParam, validate, deleteBook);

module.exports = router;
