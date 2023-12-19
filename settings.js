const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const session = require('express-session');

// Add this middleware to check if the user is logged in
router.use((req, res, next) => {
    // Check if there is an active session
    if (req.session && req.session.email) {
        // User is logged in, proceed to the next middleware or route
        next();
    } else {
        // User is not logged in, redirect to the login page
        res.redirect('/login'); // Adjust the route to your login page
    }
});


router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/settings.html'));
});

router.post('/', (req, res) => {
    const { email, currentPassword, newPassword, confirmNewPassword } = req.body;

    // Read user data from the JSON file
    const userDataPath = path.join(__dirname, '../db/users.json');
    let userData = [];

    try {
        userData = JSON.parse(fs.readFileSync(userDataPath, 'utf-8'));
    } catch (error) {
        console.error('Error reading user data:', error);
        // Redirect to /settings with an error message
        res.redirect('/settings?errorMessage=An error occurred while updating the password.');
        return;
    }

    // Find the user in the array
    const userIndex = userData.findIndex(user => user.email === email && user.password === currentPassword);

    if (userIndex !== -1) {
        // Check if the new password and confirm new password match
        if (newPassword !== confirmNewPassword) {
            // Redirect to /settings with an error message
            res.redirect('/settings?errorMessage=New password and confirm new password must match.');
            return;
        }

        // Update the password
        userData[userIndex].password = newPassword;

        // Write the updated user data back to the JSON file
        fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2));

        // Redirect to /dashboard with a success message
        res.redirect('/dashboard?successMessage=Password updated successfully.');
    } else {
        // Redirect to /settings with an error message
        res.redirect('/settings?errorMessage=Invalid email or current password.');
    }
});

module.exports = router;
