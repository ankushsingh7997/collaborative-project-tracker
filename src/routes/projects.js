const express = require("express");
const { body } = require("express-validator");
const {getProjects, getProject, createProject, updateProject, deleteProject, joinProject} = require("../controllers/projectController");
const auth = require("../middleware/auth");
const api_logs = require('../middleware/api');

const router = express.Router();

router.use(auth);

// Get all user projects
router.get("/", api_logs, getProjects);

// Get single project
router.get("/:id", api_logs, getProject);

// Create project
router.post(
  "/",
  api_logs, 
  [
    body("name").trim().isLength({ min: 1, max: 100 }).withMessage("Project name must be between 1 and 100 characters"),
    body("deadline").isISO8601().toDate().withMessage("Please provide a valid deadline"),
    body("description").optional().trim().isLength({ max: 500 }).withMessage("Description must not exceed 500 characters"),
  ],
  createProject
);

// Update project
router.put(
  "/:id",
  api_logs, 
  [
    body("name").optional().trim().isLength({ min: 1, max: 100 }).withMessage("Project name must be between 1 and 100 characters"),
    body("deadline").optional().isISO8601().toDate().withMessage("Please provide a valid deadline"),
    body("description").optional().trim().isLength({ max: 500 }).withMessage("Description must not exceed 500 characters"),
  ],
  updateProject
);

// Delete project
router.delete("/:id", api_logs, deleteProject);

// Join project
router.post(
  "/join",
  api_logs, 
  [body("inviteCode").trim().isLength({ min: 1 }).withMessage("Invite code is required")],
  joinProject
);

module.exports = router;
