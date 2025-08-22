const Task = require('../models/Task');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');
const catchAsync = require('../utils/catchAsync');

// ----------------------
// Get tasks for a project
// ----------------------
const getByProject = catchAsync(async (req, res) => {
  const { projectId } = req.params;
  const { status, assignee } = req.query;

  const project = await Project.findById(projectId);
  if (!project || !project.members.includes(req.user._id)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const filter = { project: projectId };
  if (status) filter.status = status;
  if (assignee) filter.assignee = assignee;

  const tasks = await Task.find(filter)
    .populate('assignee', 'username email')
    .populate('createdBy', 'username email')
    .sort({ updatedAt: -1 });

  res.json(tasks);
});

// ----------------------
// Create task
// ----------------------
const create = catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { projectId } = req.params;
  const { title, description, priority, assignee } = req.body;

  const project = await Project.findById(projectId);
  if (!project || !project.members.includes(req.user._id)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  if (assignee && !project.members.includes(assignee)) {
    return res.status(400).json({ message: 'Assignee must be a project member' });
  }

  const task = new Task({
    title,
    description,
    priority,
    assignee,
    project: projectId,
    createdBy: req.user._id,
  });

  await task.save();
  await task.populate('assignee', 'username email');
  await task.populate('createdBy', 'username email');

  // req.app.get('io').to(`project_${projectId}`).emit('taskCreated', task);

  res.status(201).json(task);
});

// ----------------------
// Update task
// ----------------------
const update = catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const task = await Task.findById(req.params.id).populate('project');
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const project = task.project;
  const isOwner = project.owner.equals(req.user._id);
  const isAssignee = task.assignee && task.assignee.equals(req.user._id);
  const isCreator = task.createdBy.equals(req.user._id);

  if (!isOwner && !isAssignee && !isCreator) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { title, description, status, priority, assignee } = req.body;

  if (assignee && !project.members.includes(assignee)) {
    return res.status(400).json({ message: 'Assignee must be a project member' });
  }

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (status !== undefined) task.status = status;
  if (priority !== undefined) task.priority = priority;
  if (assignee !== undefined) task.assignee = assignee;

  await task.save();
  await task.populate('assignee', 'username email');
  await task.populate('createdBy', 'username email');

  // req.app.get('io').to(`project_${project._id}`).emit('taskUpdated', task);

  res.json(task);
});

// ----------------------
// Delete task
// ----------------------
const remove = catchAsync(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('project');
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const project = task.project;
  const isOwner = project.owner.equals(req.user._id);
  const isCreator = task.createdBy.equals(req.user._id);

  if (!isOwner && !isCreator) {
    return res.status(403).json({ message: 'Access denied' });
  }

  await Task.findByIdAndDelete(req.params.id);

  // req.app.get('io').to(`project_${project._id}`).emit('taskDeleted', { taskId: task._id });

  res.json({ message: 'Task deleted successfully' });
});

// ----------------------
// Upload file
// ----------------------
const upload = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const task = await Task.findById(req.params.id).populate('project');
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const project = task.project;
  if (!project.members.includes(req.user._id)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const attachment = {
    filename: req.file.filename,
    originalName: req.file.originalname,
    url: `/uploads/${req.file.filename}`,
    size: req.file.size,
    uploadedBy: req.user._id,
    uploadedAt: new Date(),
  };

  task.attachments.push(attachment);
  await task.save();

  // req.app.get('io').to(`project_${project._id}`).emit('taskUpdated', task);

  res.json({ message: 'File uploaded successfully', attachment });
});

module.exports = { getByProject, create, update, remove, upload };
