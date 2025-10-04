const User = require('../models/User');
const bcrypt = require('bcrypt');

// Form render karne ka GET route (yeh aapke paas pehle se hai)
exports.getAddEmployeeForm = (req, res) => {
    res.render('users/new', { title: 'Add New Employee' });
};

// Form ka data handle karne ka POST route
exports.postAddEmployee = (req, res) => {
    const { name, email, password, role } = req.body;

    // Check karein ki saari fields bhari hui hain
    if (!name || !email || !password || !role) {
        req.flash('error_msg', 'Please fill in all fields');
        return res.redirect('/users/add/employee');
    }

    User.findOne({ email: email }).then(user => {
        if (user) {
            // Agar user pehle se exist karta hai
            req.flash('error_msg', 'Email is already registered');
            res.redirect('/users/add/employee');
        } else {
            // Naya user banayein
            const newUser = new User({
                name,
                email,
                password,
                role,
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