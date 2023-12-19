// signup.js

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.static('public'))

// File path for storing user data
const userDataFilePath = path.join(__dirname, '../db/users.json');

// Email validation regex for accepted domains
const acceptedEmailDomains = /^(gmail\.com|hotmail\.com|yahoo\.com|outlook\.com|mail\.com)$/i;

// Password validation regex for at least 8 characters including letters and numbers
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

// Route to display the signup form
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/signup.html'));
});

// Route to handle the signup form submission

router.post('/', (req, res) => {
    // Extract user details from the form submission
    const { fullname, email, creditCardNumber, phoneNumber, password } = req.body;

    try {
        // Email validation: Check if the email domain is accepted
        if (!acceptedEmailDomains.test(email.split('@')[1])) {
            return res.redirect('/signup?error=invalidEmailDomain');
        }

        // Password validation: Check if the password meets the criteria
        if (!passwordRegex.test(password)) {
            return res.redirect('/signup?error=invalidPassword');
        }

        // Credit card number validation: Check if it is 16 digits
        if (!/^\d{16}$/.test(creditCardNumber)) {
            return res.redirect('/signup?error=invalidCreditCardNumber');
        }

        // Read existing user data from the JSON file
        let userData = [];

        try {
            userData = JSON.parse(fs.readFileSync(userDataFilePath, 'utf-8'));
        } catch (error) {
            // Handle the case where the file is empty or not valid JSON
            console.error('Error reading user data:', error);
        }

        // Check if the email is already registered
        if (userData.some(user => user.email === email)) {
            // Redirect to the signup page with an error query parameter
            return res.redirect('/signup?error=emailRegistered');
        }

        // Create a new user object
        const newUser = {
            fullname,
            email,
            creditCardNumber,
            phoneNumber,
            password,
          allRequested: []
        };

        // Add the new user to the array
        userData.push(newUser);

        // Write the updated user data back to the JSON file
        fs.writeFileSync(userDataFilePath, JSON.stringify(userData, null, 2));

        // Redirect to the signup page with a success query parameter
        res.redirect('/signup?success=true');
    } catch (error) {
        console.error(error);
        // Redirect to the signup page with an error query parameter
        res.redirect('/signup?error=signupError');
    }
});

module.exports = router;
