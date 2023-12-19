// routes/admin/login.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// File path for storing admin data
const adminDataFilePath = path.join(__dirname, '../../db/admin.json');

// Route to display the admin login form
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/admin/login.html'));
});


// Route to handle the admin login form submission
router.post('/login', (req, res) => {
    // Extract admin credentials from the form submission
    const { email, password } = req.body;

    try {
        // Read existing admin data from the JSON file
        const adminData = JSON.parse(fs.readFileSync(adminDataFilePath, 'utf-8'));

        // Check if the admin exists in the database
        const admin = adminData.find(admin => admin.email === email && admin.password === password);

        if (admin) {
            // Set the isAdmin property in the session to true upon successful login
            req.session.isAdmin = true;

            // Redirect to the admin dashboard upon successful login
            res.redirect('/admin/admin.html');
        } else {
            res.send('Admin Login Failed');
        }
    } catch (error) {
        console.error(error);
        res.send('Error during admin login. Please try again.');
    }
});


// ... (existing code)
module.exports = router;