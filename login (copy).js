// login.js
const session = require('express-session');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.static('public'))

// File path for storing user data
const userDataFilePath = path.join(__dirname, '../db/users.json');

// Route to display the login form
router.get('/', (req, res) => {
    // Check if the user is already logged in
    if (req.session.email) {
        // Redirect to the dashboard if logged in
        res.redirect('/dashboard');
    } else {
        // Render the login form
        res.sendFile(path.join(__dirname, '../public/login.html'));
    }
});



router.get('/wrong-credentials', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/wrong-credentials.html'));
});


router.get('/successful-login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/successful-login.html'));
});


router.post('/', (req, res) => {
    const { email, password } = req.body;

    try {
        const userData = JSON.parse(fs.readFileSync(userDataFilePath, 'utf-8'));
        const user = userData.find(user => user.email === email && user.password === password);

        if (user) {
            // Check if the 'balance' column exists for the user
            if (!user.hasOwnProperty('balance')) {
                user.balance = 0; // Initialize balance to 0 if it doesn't exist
            }

            req.session.email = email;

            // Redirect to the transitional page
            res.redirect('/login/successful-login');
        } else {
            res.redirect('/login/wrong-credentials');
        }

        // Save the updated user data to the file
        fs.writeFileSync(userDataFilePath, JSON.stringify(userData, null, 2));
    } catch (error) {
        console.error(error);
        res.send('Error during login. Please try again.');
    }
});



module.exports = router;
