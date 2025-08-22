const Task = require('../models/Task');
const Comment = require('../models/Comment');
const catchAsync=require("../utils/catchAsync")
const { validationResult } = require('express-validator');

const get =catchAsync(async(req,res,next)=>{
    const { taskId } = req.params;

    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = task.project;
    if (!project.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const comments = await Comment.find({ task: taskId })
      .populate('author', 'username email')
      .sort({ createdAt: 1 });

    return res.json(comments);
})

const create=catchAsync(async(req,res,next)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { taskId } = req.params;
    const { content } = req.body;

    // Check if user has access to the task
    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = task.project;
    if (!project.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const comment = new Comment({
      content,
      author: req.user._id,
      task: taskId
    });

    await comment.save();
    await comment.populate('author', 'username email');

    // Emit socket event for real-time updates
    req.app.get('io').to(`project_${project._id}`).emit('commentCreated', comment);

    res.status(201).json(comment);
})

const update=catchAsync(async(req,res,next)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const comment = await Comment.findById(req.params.id).populate({
      path: 'task',
      populate: { path: 'project' }
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Only author can update comment
    if (!comment.author.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { content } = req.body;
    comment.content = content;
    await comment.save();
    await comment.populate('author', 'username email');

    // Emit socket event for real-time updates
    const project = comment.task.project;
    req.app.get('io').to(`project_${project._id}`).emit('commentUpdated', comment);

    res.json(comment);
})

const remove=catchAsync(async(req,res,next)=>{
    const comment = await Comment.findById(req.params.id).populate({
        path: 'task',
        populate: { path: 'project' }
      });
  
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }
  
      // Only author or project owner can delete comment
      const project = comment.task.project;
      const isAuthor = comment.author.equals(req.user._id);
      const isOwner = project.owner.equals(req.user._id);
  
      if (!isAuthor && !isOwner) {
        return res.status(403).json({ message: 'Access denied' });
      }
  
      await Comment.findByIdAndDelete(req.params.id);
  
      // Emit socket event for real-time updates
      req.app.get('io').to(`project_${project._id}`).emit('commentDeleted', { commentId: comment._id });
  
      res.json({ message: 'Comment deleted successfully' });
})

module.exports={ get, create, update, remove }