const Author = require('../models/Author');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all authors
// @route   GET /api/authors
const getAuthors = asyncHandler(async (req, res) => {
  const authors = await Author.find().sort({ name: 1 });
  res.status(200).json({ success: true, count: authors.length, data: authors });
});

// @desc    Get single author by ID
// @route   GET /api/authors/:id
const getAuthorById = asyncHandler(async (req, res) => {
  const author = await Author.findById(req.params.id);
  if (!author) {
    return res.status(404).json({ success: false, message: 'Author not found' });
  }
  res.status(200).json({ success: true, data: author });
});

// @desc    Create a new author
// @route   POST /api/authors
const createAuthor = asyncHandler(async (req, res) => {
  const author = await Author.create(req.body);
  res.status(201).json({ success: true, data: author });
});

// @desc    Update an author
// @route   PUT /api/authors/:id
const updateAuthor = asyncHandler(async (req, res) => {
  const author = await Author.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!author) {
    return res.status(404).json({ success: false, message: 'Author not found' });
  }
  res.status(200).json({ success: true, data: author });
});

// @desc    Delete an author
// @route   DELETE /api/authors/:id
const deleteAuthor = asyncHandler(async (req, res) => {
  const author = await Author.findByIdAndDelete(req.params.id);
  if (!author) {
    return res.status(404).json({ success: false, message: 'Author not found' });
  }
  res.status(200).json({ success: true, message: 'Author deleted', data: author });
});

module.exports = {
  getAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor,
};
