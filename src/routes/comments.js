const express = require('express');
const { body } = require('express-validator');
const { validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Task = require('../models/Task');
const commentsController=require("../controllers/commentsController")
const auth = require('../middleware/auth');
const api_logs = require('../middleware/api');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get comments for a task
router.get('/task/:taskId', api_logs, commentsController.get);

// Create comment
router.post('/task/:taskId', api_logs, [body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment must be between 1 and 1000 characters')],commentsController.create );

// Update comment
router.put('/:id', api_logs, [ body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment must be between 1 and 1000 characters')], commentsController.update);

// Delete comment
router.delete('/:id', api_logs, commentsController.remove);

module.exports = router;