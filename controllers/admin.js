const User = require('../models/User');
const ApprovalRule = require('../models/ApprovalRule');

exports.getAddEmployeeForm = (req, res) => {
    res.render('admin/addemployee', { title: 'Add New Employee' });
};

exports.postAddEmployee = (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        req.flash('error_msg', 'Please fill in all fields');
        return res.redirect('/admin/add/employee');
    }

    User.findOne({ email: email }).then(user => {
        if (user) {
            req.flash('error_msg', 'Email is already registered');
            res.redirect('/admin/add/employee');
        } else {
            const newUser = new User({
                username,
                email,
                password, // Password ko plain text mein hi rakhein
                role: "Employee",
                company: req.user.company
            });

            // .save() call karne par password automatically encrypt ho jayega (User.js model ke kaaran)
            newUser.save()
                .then(user => {
                    req.flash('success_msg', 'Employee added successfully');
                    res.redirect('/dashboard');
                })
                .catch(err => {
                    console.log(err);
                    req.flash('error_msg', 'Could not add employee.');
                    res.redirect('/admin/add/employee');
                });
        }
    });
};

exports.getAddManagerForm = (req, res) => {
    res.render('admin/addmanager', { title: 'Add New Manager' });
};

exports.postAddManager = (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        req.flash('error_msg', 'Please fill in all fields');
        return res.redirect('/admin/add/manager');
    }

    User.findOne({ email: email }).then(user => {
        if (user) {
            req.flash('error_msg', 'Email is already registered');
            res.redirect('/admin/add/manager');
        } else {
            const newUser = new User({
                username,
                email,
                password,
                role: "Manager",
                company: req.user.company
            });
            newUser.save()
                .then(user => {
                    req.flash('success_msg', 'Manager added successfully');
                    res.redirect('/dashboard');
                })
                .catch(err => {
                    console.log(err);
                    req.flash('error_msg', 'Could not add manager.');
                    res.redirect('/admin/add/manager');
                });
        }
    });
};

exports.getAddFinanceForm = (req, res) => {
    res.render('admin/addfinance', { title: 'Add New Finance User' });
};

exports.postAddFinance = (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        req.flash('error_msg', 'Please fill in all fields');
        return res.redirect('/admin/add/finance');
    }

    User.findOne({ email: email }).then(user => {
        if (user) {
            req.flash('error_msg', 'Email is already registered');
            res.redirect('/admin/add/finance');
        } else {
            const newUser = new User({
                username,
                email,
                password,
                role: "Finance",
                company: req.user.company
            });
            newUser.save()
                .then(user => {
                    req.flash('success_msg', 'Finance user added successfully');
                    res.redirect('/dashboard');
                })
                .catch(err => {
                    console.log(err);
                    req.flash('error_msg', 'Could not add finance user.');
                    res.redirect('/admin/add/finance');
                });
        }
    });
};

exports.getAddDirectorForm = (req, res) => {
    res.render('admin/adddirector', { title: 'Add New Director' });
};

exports.postAddDirector = (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        req.flash('error_msg', 'Please fill in all fields');
        return res.redirect('/admin/add/director');
    }

    User.findOne({ email: email }).then(user => {
        if (user) {
            req.flash('error_msg', 'Email is already registered');
            res.redirect('/admin/add/director');
        } else {
            const newUser = new User({
                username,
                email,
                password,
                role: "Director",
                company: req.user.company
            });
            newUser.save()
                .then(user => {
                    req.flash('success_msg', 'Director added successfully');
                    res.redirect('/dashboard');
                })
                .catch(err => {
                    console.log(err);
                    req.flash('error_msg', 'Could not add director.');
                    res.redirect('/admin/add/director');
                });
        }
    });
};


// --- Assign Manager & Workflow ---
exports.getAssignManagerPage = async (req, res) => {
    try {
        const companyId = req.user.company;
        const employees = await User.find({ company: companyId, role: 'Employee' });
        const managers = await User.find({ company: companyId, role: 'Manager' });

        res.render('admin/assignManager', {
            title: 'Assign Manager',
            employees,
            managers
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Could not load page.');
        res.redirect('/dashboard');
    }
};

exports.postAssignManager = async (req, res) => {
    try {
        const { employeeId, managerId } = req.body;
        await User.findByIdAndUpdate(employeeId, { manager: managerId });
        req.flash('success_msg', 'Manager assigned successfully.');
        res.redirect('/admin/assign-manager');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Failed to assign manager.');
        res.redirect('/admin/assign-manager');
    }
};

exports.getApprovalWorkflowPage = async (req, res) => {
    try {
        const companyId = req.user.company;
        const approvalRule = await ApprovalRule.findOne({ company: companyId });
        res.render('admin/approvalWorkflow', {
            title: 'Approval Workflow',
            approvalRule: approvalRule || { steps: [] }
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Could not load page.');
        res.redirect('/dashboard');
    }
};

exports.postApprovalWorkflow = async (req, res) => {
    try {
        const companyId = req.user.company;
        const { approverRole } = req.body;

        let approvalRule = await ApprovalRule.findOne({ company: companyId });
        if (!approvalRule) {
            approvalRule = new ApprovalRule({ company: companyId });
        }
        
        const steps = Array.isArray(approverRole) ? approverRole : [approverRole];

        approvalRule.steps = steps.map((role, index) => ({
            step: index + 1,
            approverRole: role
        }));
        
        await approvalRule.save();

        req.flash('success_msg', 'Approval workflow saved successfully.');
        res.redirect('/admin/approval-workflow');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Failed to save approval workflow.');
        res.redirect('/admin/approval-workflow');
    }
};