const Book = require('../models/Book');
const Author = require('../models/Author');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all books (populated with author info)
// @route   GET /api/books
const getBooks = asyncHandler(async (req, res) => {
  const books = await Book.find().populate('author', 'name nationality').sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: books.length, data: books });
});

// @desc    Get single book by ID
// @route   GET /api/books/:id
const getBookById = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id).populate('author', 'name nationality');
  if (!book) {
    return res.status(404).json({ success: false, message: 'Book not found' });
  }
  res.status(200).json({ success: true, data: book });
});

// @desc    Create a new book
// @route   POST /api/books
const createBook = asyncHandler(async (req, res) => {
  // Confirm the referenced author actually exists before creating the book
  const authorExists = await Author.findById(req.body.author);
  if (!authorExists) {
    return res.status(400).json({ success: false, message: 'Author with that ID does not exist' });
  }

  const book = await Book.create(req.body);
  res.status(201).json({ success: true, data: book });
});

// @desc    Update a book
// @route   PUT /api/books/:id
const updateBook = asyncHandler(async (req, res) => {
  if (req.body.author) {
    const authorExists = await Author.findById(req.body.author);
    if (!authorExists) {
      return res.status(400).json({ success: false, message: 'Author with that ID does not exist' });
    }
  }

  const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!book) {
    return res.status(404).json({ success: false, message: 'Book not found' });
  }
  res.status(200).json({ success: true, data: book });
});

// @desc    Delete a book
// @route   DELETE /api/books/:id
const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findByIdAndDelete(req.params.id);
  if (!book) {
    return res.status(404).json({ success: false, message: 'Book not found' });
  }
  res.status(200).json({ success: true, message: 'Book deleted', data: book });
});

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
};
