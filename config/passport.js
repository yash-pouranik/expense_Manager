const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

// Load User Model
const User = require('../models/User'); 

module.exports = function(passport) {
    passport.use(
        new LocalStrategy({ usernameField: 'username' }, (username, password, done) => {
            // Match User
            User.findOne({ username: username })
                .then(user => {
                    if (!user) {
                        return done(null, false, { message: 'That username is not registered' });
                    }

                    // Match Password
                    bcrypt.compare(password, user.password, (err, isMatch) => {
                        if (err) throw err;

                        if (isMatch) {
                            return done(null, user);
                        } else {
                            return done(null, false, { message: 'Password incorrect' });
                        }
                    });
                })
                .catch(err => console.log(err));
        })
    );

    // Serialize User (save user ID to session)
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Deserialize User (retrieve user data from session ID)
    passport.deserializeUser(async (id, done) => {
        try {
            // CRITICAL FIX: Use .populate('company') to fetch the full company document
            const user = await User.findById(id).populate('company').exec(); 
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
};