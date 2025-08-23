const Comment = require('../models/Comment');
const Task = require('../models/Task');
const { validationResult } = require('express-validator');
const catchAsync = require('../utils/catchAsync');
// Import socket functions directly from handlers
const { emitToProjectMembers, emitToUser } = require('../socket/handlers');

// ----------------------
// Get comments for a task
// ----------------------
const get = catchAsync(async (req, res) => {
  const { taskId } = req.params;
  
  // Verify user has access to this task
  const task = await Task.findById(taskId).populate('project');
  if (!task || !task.project.members.includes(req.user._id)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const comments = await Comment.find({ task: taskId })
    .populate('author', 'username email avatar')
    .sort({ createdAt: 1 });

  res.json(comments);
});

// ----------------------
// Create comment
// ----------------------
const create = catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { taskId } = req.params;
  const { content } = req.body;

  // Verify user has access to this task
  const task = await Task.findById(taskId).populate('project');
  if (!task || !task.project.members.includes(req.user._id)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const comment = new Comment({
    content,
    author: req.user._id,
    task: taskId
  });

  await comment.save();
  await comment.populate('author', 'username email avatar');

  const io = req.app.get('io');

  // Emit to all project members except the comment author
  await emitToProjectMembers(io, task.project._id, 'commentAdded', {
    comment,
    task: {
      _id: task._id,
      title: task.title
    },
    author: {
      id: req.user._id,
      username: req.user.username
    },
    timestamp: new Date()
  }, req.user._id);

  // If task is assigned to someone other than the comment author, notify them specifically
  if (task.assignee && !task.assignee.equals(req.user._id)) {
    emitToUser(io, task.assignee.toString(), 'commentOnYourTask', {
      comment,
      task: {
        _id: task._id,
        title: task.title
      },
      author: {
        id: req.user._id,
        username: req.user.username
      },
      timestamp: new Date()
    });
  }

  res.status(201).json(comment);
});

// ----------------------
// Update comment
// ----------------------
const update = catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { content } = req.body;

  const comment = await Comment.findById(id).populate('author', 'username email avatar');
  if (!comment) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  // Only comment author can update their own comment
  if (!comment.author._id.equals(req.user._id)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  // Get task and project info for notifications
  const task = await Task.findById(comment.task).populate('project');
  if (!task) {
    return res.status(404).json({ message: 'Associated task not found' });
  }

  const oldContent = comment.content;
  comment.content = content;
  await comment.save();

  const io = req.app.get('io');

  // Emit to all project members except the comment author
  await emitToProjectMembers(io, task.project._id, 'commentUpdated', {
    comment,
    task: {
      _id: task._id,
      title: task.title
    },
    updatedBy: {
      id: req.user._id,
      username: req.user.username
    },
    oldContent,
    timestamp: new Date()
  }, req.user._id);

  res.json(comment);
});

// ----------------------
// Delete comment
// ----------------------
const remove = catchAsync(async (req, res) => {
  const { id } = req.params;

  const comment = await Comment.findById(id).populate('author', 'username email avatar');
  if (!comment) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  // Get task and project info for notifications
  const task = await Task.findById(comment.task).populate('project');
  if (!task) {
    return res.status(404).json({ message: 'Associated task not found' });
  }

  // Only comment author or project owner can delete
  const isAuthor = comment.author._id.equals(req.user._id);
  const isProjectOwner = task.project.owner.equals(req.user._id);
  
  if (!isAuthor && !isProjectOwner) {
    return res.status(403).json({ message: 'Access denied' });
  }

  // Store comment info before deletion
  const commentInfo = {
    id: comment._id,
    content: comment.content,
    author: {
      id: comment.author._id,
      username: comment.author.username
    }
  };

  await Comment.findByIdAndDelete(id);

  const io = req.app.get('io');

  // Emit to all project members except the deleter
  await emitToProjectMembers(io, task.project._id, 'commentDeleted', {
    commentId: commentInfo.id,
    task: {
      _id: task._id,
      title: task.title
    },
    deletedBy: {
      id: req.user._id,
      username: req.user.username
    },
    originalAuthor: commentInfo.author,
    timestamp: new Date()
  }, req.user._id);

  res.json({ message: 'Comment deleted successfully' });
});

// ----------------------
// Get comment statistics for a project (optional utility endpoint)
// ----------------------
const getProjectStats = catchAsync(async (req, res) => {
  const { projectId } = req.params;

  // Verify user has access to this project
  const Project = require('../models/Project');
  const project = await Project.findById(projectId);
  if (!project || !project.members.includes(req.user._id)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  // Get all tasks for this project
  const tasks = await Task.find({ project: projectId }).select('_id');
  const taskIds = tasks.map(task => task._id);

  // Aggregate comment statistics
  const stats = await Comment.aggregate([
    { $match: { task: { $in: taskIds } } },
    {
      $group: {
        _id: '$author',
        commentCount: { $sum: 1 },
        lastCommentDate: { $max: '$createdAt' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'author',
        pipeline: [{ $project: { username: 1, email: 1, avatar: 1 } }]
      }
    },
    { $unwind: '$author' },
    { $sort: { commentCount: -1 } }
  ]);

  const totalComments = await Comment.countDocuments({ task: { $in: taskIds } });

  res.json({
    totalComments,
    commentsByUser: stats,
    projectId
  });
});

module.exports = {
  get,
  create,
  update,
  remove,
  getProjectStats
};