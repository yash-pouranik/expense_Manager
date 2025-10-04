const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');

const { ensureAuthenticated } = require('../middleware/auth'); // Assuming you have auth middleware

// GET route to show the form
router.get('/add/employee', ensureAuthenticated, adminController.getAddEmployeeForm);


router.get('/add/manager', ensureAuthenticated, adminController.getAddManagerForm);



// POST route to handle form submission
router.post('/add/employee', ensureAuthenticated, adminController.postAddEmployee);


router.post('/add/manager', ensureAuthenticated, adminController.postAddManager);


// --- NEW ROUTES ---
// Page to view and assign managers
router.get('/assign-manager', ensureAuthenticated, adminController.getAssignManagerPage);
// Handle the form submission
router.post('/assign-manager', ensureAuthenticated, adminController.postAssignManager);

// Baaki ke user routes...
// router.get('/login', ...);

module.exports = router;