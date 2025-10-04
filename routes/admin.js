const express = require('express');
const router = express.Router();
const userController = require('../controllers/admin');
const { ensureAuthenticated } = require('../middleware/auth'); // Assuming you have auth middleware

// GET route to show the form
router.get('/add/employee', ensureAuthenticated, userController.getAddEmployeeForm);


router.get('/add/manager', ensureAuthenticated, userController.getAddManagerForm);



// POST route to handle form submission
router.post('/add/employee', ensureAuthenticated, userController.postAddEmployee);


router.post('/add/manager', ensureAuthenticated, userController.postAddManager);



// Baaki ke user routes...
// router.get('/login', ...);

module.exports = router;