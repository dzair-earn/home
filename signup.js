// signup.js

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.static('public'));

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

function generateReferralCode() {
    const timestamp = Date.now().toString(36);
    return `user-${timestamp}-${Math.random().toString(36).substring(2, 8)}`;
}

router.post('/', (req, res) => {
  let { fullname, email, creditCardNumber, phoneNumber, password, referralCode: userReferralCode } = req.body;

  if (!userReferralCode) {
      userReferralCode = "user-lpy55abw-u2376j";
  }

  const balance = 0;

    try {
        if (!acceptedEmailDomains.test(email.split('@')[1])) {
            return res.redirect('/signup?error=invalidEmailDomain');
        }

        if (!passwordRegex.test(password)) {
            return res.redirect('/signup?error=invalidPassword');
        }

        if (!/^\d{16}$/.test(creditCardNumber)) {
            return res.redirect('/signup?error=invalidCreditCardNumber');
        }

        let userData = [];

        try {
            userData = JSON.parse(fs.readFileSync(userDataFilePath, 'utf-8'));
        } catch (error) {
            console.error('Error reading user data:', error);
        }

        if (userData.some(user => user.email === email)) {
            return res.redirect('/signup?error=emailRegistered');
        }

        // Generate a new referral code for the referred user
        const newUserReferralCode = generateReferralCode(email);

        const newUser = {
            fullname,
            email,
            creditCardNumber,
            phoneNumber,
            password,
          balance,
            referralCode: newUserReferralCode,
            referredUsers: [],
        };

        if (userReferralCode) {
            // Find the referrer and add the new user's email to their referredUsers
            const referrer = userData.find(user => user.referralCode === userReferralCode);
            if (referrer) {
                referrer.referredUsers.push(email);
            }
        }

        userData.push(newUser);

        fs.writeFileSync(userDataFilePath, JSON.stringify(userData, null, 2));

        res.redirect('/signup?success=true');
    } catch (error) {
        console.error(error);
        res.redirect('/signup?error=signupError');
    }
});



module.exports = router;
