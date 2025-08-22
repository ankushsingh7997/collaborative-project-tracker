const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const tasksController = require('../controllers/taskController');
const api_logs = require('../middleware/api');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get tasks for a project
router.get('/project/:projectId', api_logs, tasksController.getByProject);

// Create task
router.post(
  '/project/:projectId',
  api_logs, 
  [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
    body('assignee').optional().isMongoId().withMessage('Invalid assignee ID'),
  ],
  tasksController.create
);

// Update task
router.put(
  '/:id',
  api_logs, 
  [
    body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
    body('status').optional().isIn(['todo', 'in-progress', 'done']).withMessage('Status must be todo, in-progress, or done'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
    body('assignee').optional().isMongoId().withMessage('Invalid assignee ID'),
  ],
  tasksController.update
);

// Delete task
router.delete('/:id', api_logs, tasksController.remove);

// Upload file attachment
router.post('/:id/upload', api_logs, upload.single('file'), tasksController.upload);

module.exports = router;
