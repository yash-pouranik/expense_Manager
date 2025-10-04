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

// --- NEW ROUTES for Approval Workflow ---
router.get('/approval-workflow', ensureAuthenticated, adminController.getApprovalWorkflowPage);
router.post('/approval-workflow', ensureAuthenticated, adminController.postApprovalWorkflow);

// Baaki ke user routes...
// router.get('/login', ...);

// ... postAssignManager route ke baad ...

// --- Finance User Routes ---
router.get('/add/finance', ensureAuthenticated, adminController.getAddFinanceForm);
router.post('/add/finance', ensureAuthenticated, adminController.postAddFinance);

// --- Director User Routes ---
router.get('/add/director', ensureAuthenticated, adminController.getAddDirectorForm);
router.post('/add/director', ensureAuthenticated, adminController.postAddDirector);

module.exports = router;


module.exports = router;