const { validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const catchAsync=require('../utils/catchAsync')

const getProjects = catchAsync(async (req, res) => {
  const projects = await Project.find({ members: req.user._id })
    .populate('owner', 'username email')
    .populate('members', 'username email')
    .sort({ updatedAt: -1 });

  res.json(projects);
});

const getProject = catchAsync(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'username email')
    .populate('members', 'username email');

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  if (!project.members.some(member => member._id.equals(req.user._id))) {
    return res.status(403).json({ message: 'Access denied' });
  }

  res.json(project);
});

const createProject = catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, deadline } = req.body;

  const project = new Project({
    name,
    description,
    deadline,
    owner: req.user._id,
  });

  await project.save();
  await project.populate('owner', 'username email');
  await project.populate('members', 'username email');

  res.status(201).json(project);
});

const updateProject = catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  if (!project.owner.equals(req.user._id)) {
    return res.status(403).json({ message: 'Only project owner can update' });
  }

  const { name, description, deadline } = req.body;

  project.name = name || project.name;
  project.description = description || project.description;
  project.deadline = deadline || project.deadline;

  await project.save();
  await project.populate('owner', 'username email');
  await project.populate('members', 'username email');

  res.json(project);
});

const deleteProject = catchAsync(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  if (!project.owner.equals(req.user._id)) {
    return res.status(403).json({ message: 'Only project owner can delete' });
  }
  await Promise.all([Task.deleteMany({ project: project._id }),Project.findByIdAndDelete(req.params.id)])
  // await Task.deleteMany({ project: project._id });
  // await Project.findByIdAndDelete(req.params.id);

  res.json({ message: 'Project deleted successfully' });
});

const joinProject = catchAsync(async (req, res) => {
  const { inviteCode } = req.body;

  const project = await Project.findOne({ inviteCode })
    .populate('owner', 'username email')
    .populate('members', 'username email');

  if (!project) {
    return res.status(404).json({ message: 'Invalid invite code' });
  }

  if (project.members.some(member => member._id.equals(req.user._id))) {
    return res.status(400).json({ message: 'Already a member of this project' });
  }

  project.members.push(req.user._id);
  await project.save();
  await project.populate('members', 'username email');

  res.json({ message: 'Successfully joined project', project });
});


module.exports = { getProjects, getProject, createProject, updateProject, deleteProject, joinProject };