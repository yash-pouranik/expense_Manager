const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAdmin } = require('../middleware/auth'); // Import Admin middleware

// Ensure all routes in this file are restricted to Admin
router.use(isAdmin); 

// @route GET /users/new
// @desc Admin: Show form to create new Employee/Manager [cite: 13]
router.get('/new', userController.getCreateUserPage);

// @route POST /users
// @desc Admin: Handle creation of new Employee/Manager 
router.post('/', userController.handleCreateUser);

// You would add more routes here for:
// - Viewing all users
// - Updating roles/manager relationships [cite: 14, 15]

module.exports = router;