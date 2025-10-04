const User = require('../models/User');
const bcrypt = require('bcrypt');

// Form render karne ka GET route (yeh aapke paas pehle se hai)
exports.getAddEmployeeForm = (req, res) => {
    res.render('admin/addemployee', { title: 'Add New Employee' });
};

exports.getAddManagerForm = (req, res) => {
    res.render('admin/addmanager', { title: 'Add New Manager' });
};

// Form ka data handle karne ka POST route
exports.postAddEmployee = (req, res) => {
    const { username, email, password } = req.body;

    // Check karein ki saari fields bhari hui hain
    if (!username || !email || !password ) {
        req.flash('error_msg', 'Please fill in all fields');
        return res.redirect('/admin/add/employee');
    }

    User.findOne({ email: email }).then(user => {
        if (user) {
            // Agar user pehle se exist karta hai
            req.flash('error_msg', 'Email is already registered');
            res.redirect('/users/add/employee');
        } else {
            // Naya user banayein
            const newUser = new User({
                username,
                email,
                password,
                role : "Employee",
                company: req.user.company
            });

            // Password ko hash (encrypt) karein
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if (err) throw err;
                    newUser.password = hash;
                    // Naye user ko database mein save karein
                    newUser.save()
                        .then(user => {
                            req.flash('success_msg', 'Employee added successfully');
                            res.redirect('/dashboard'); // Ya kisi aur page par redirect karein
                        })
                        .catch(err => console.log(err));
                });
            });
        }
    });
};

exports.postAddManager = (req, res) => {
    const { username, email, password } = req.body;

    // Check karein ki saari fields bhari hui hain
    if (!username || !email || !password ) {
        req.flash('error_msg', 'Please fill in all fields');
        return res.redirect('/admin/add/employee');
    }

    User.findOne({ email: email }).then(user => {
        if (user) {
            // Agar user pehle se exist karta hai
            req.flash('error_msg', 'Email is already registered');
            res.redirect('/users/add/manager');
        } else {
            // Naya user banayein
            const newUser = new User({
                username,
                email,
                password,
                role : "Manager",
                company: req.user.company
            });

            // Password ko hash (encrypt) karein
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if (err) throw err;
                    newUser.password = hash;
                    // Naye user ko database mein save karein
                    newUser.save()
                        .then(user => {
                            req.flash('success_msg', 'Manager added successfully');
                            res.redirect('/dashboard'); // Ya kisi aur page par redirect karein
                        })
                        .catch(err => console.log(err));
                });
            });
        }
    });
};