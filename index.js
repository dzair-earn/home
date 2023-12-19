// original index.js
const express = require('express');
const app = express();
const path =require ('path')
const fs =require('fs')
const port = 3000;
const loginRouter = require('./routes/login');
const signupRouter = require('./routes/signup');
const settingsRouter = require('./routes/settings');
const session = require('express-session');
const ejs = require('ejs')



app.set('view engine', 'ejs'); // Set EJS as the view engine
app.set('views', path.join(__dirname, 'views')); // Set the views directory


// Add the following lines to configure body-parser
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const userDataFilePath = path.join(__dirname, './db/users.json');

const supportFolderPath = path.join(__dirname, 'support');


// Configure session middleware
app.use(session({
  secret: 'dzairEarn_session', // Replace with a secure secret key
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60 * 60 * 1000 },
}));


// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
    // Check if the user is logged in (using your session setup)
    if (req.session.email) {
        next();
    } else {
        res.redirect('/login');
    }
};
// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
    if (req.session.isAdmin) {
        next();
    } else {
        res.status(403).send('Forbidden');
    }
};



// Define a function to update and sort user data
function updateAndSortUsers() {
    try {
        let userData = [];

        // Read the user data from the file
        const fileContent = fs.readFileSync(userDataFilePath, 'utf-8');
        if (fileContent.trim() !== '') {
            userData = JSON.parse(fileContent);
        }

        // Sort users based on balance in descending order
        const sortedUsers = userData.sort((a, b) => b.balance - a.balance);

        // Write the sorted user data back to the file
        fs.writeFileSync(userDataFilePath, JSON.stringify(sortedUsers, null, 2));

        console.log('User data updated and sorted successfully.');
    } catch (error) {
        console.error('Error updating and sorting user data:', error);
    }
}

// Schedule the function to run at regular intervals (e.g., every hour)
setInterval(updateAndSortUsers, 60 * 60 * 1000); // Run every hour (adjust the interval as needed)



app.use(['/wallet', '/dashboard', '/settings', '/contact'], isAuthenticated);




app.get('/leaderboard', (req, res) => {
    try {
        let userData = [];

        const fileContent = fs.readFileSync(userDataFilePath, 'utf-8');
        if (fileContent.trim() !== '') {
            userData = JSON.parse(fileContent);
        }

        // Filter out the user with the specified email
        const userEmailToHide = "imadedar98@gmail.com";
        const filteredUsers = userData.filter(user => user.email !== userEmailToHide);

        // Sort the remaining users by balance
        const sortedUsers = filteredUsers.sort((a, b) => b.balance - a.balance);

        // Show only the first 20 users
        const top20Users = sortedUsers.slice(0, 20);

        res.render('leaderboard', { users: top20Users });
    } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        res.status(500).send('Internal server error');
    }
});






app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'))
});


app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'privacy.html'))
});

app.get('/terms-of-use', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'terms.html'))
});



app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});


app.get('/restore-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'password.html'));
});


app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }));



app.get('/admin/contactus', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'contactus.html'))
});



app.use('/admin/admin.html', express.static(path.join(__dirname, 'public/admin/admin.html')));

const adminLoginRouter = require('./routes/admin/login');

app.use('/admin', adminLoginRouter);




app.get('/admin/adminblog', isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'adminblog.html'));
});



const blogsFolderPath = path.join(__dirname, 'blogs');

// Ensure the 'blogs' folder exists
if (!fs.existsSync(blogsFolderPath)) {
    fs.mkdirSync(blogsFolderPath);
}

// Route to handle the blog creation form submission
app.post('/admin/adminblog/create', isAdmin, (req, res) => {
  console.log('Received blog creation request:', req.body); // Add this line for logging

    const { blogTitle, blogContent } = req.body;

    // Create a new blog object
    const newBlog = {
        title: blogTitle,
      snippet: blogSnippet,
        content: blogContent,
        timestamp: new Date().toLocaleString(),
    };

    // Ensure the user is an admin before allowing blog creation
    if (req.session.isAdmin) {
        // Save the blog to a file in the 'blogs' folder using the title as the file name
        const blogFileName = `${blogTitle.replace(/\s+/g, '_').toLowerCase()}.json`;
        const blogFilePath = path.join(blogsFolderPath, blogFileName);

        fs.writeFileSync(blogFilePath, JSON.stringify(newBlog, null, 2));

        console.log('New blog created:', newBlog);
        res.redirect(`/blog/${encodeURIComponent(blogTitle)}`); // Redirect to the blog page after successful submission
    } else {
        console.log('User is not an admin');
        res.status(403).send('Forbidden'); // If not an admin, send Forbidden status
    }
});


// Route to view a specific blog
app.get('/blog/:title', (req, res) => {
    const blogTitle = req.params.title;
    const blogFileName = `${blogTitle.replace(/\s+/g, '_').toLowerCase()}.json`;
    const blogFilePath = path.join(blogsFolderPath, blogFileName);

    try {
        // Read the blog data from the file
        const blogData = JSON.parse(fs.readFileSync(blogFilePath, 'utf-8'));

        // Render a page to display the full blog
        res.render('fullBlog', { blog: blogData });
    } catch (error) {
        console.log('Error reading blog file:', error);
        res.status(404).send('Blog not found');
    }
});




// Route to display the list of blogs
app.get('/blog', (req, res) => {
    // Read all blog files from the 'blogs' folder
    const blogFiles = fs.readdirSync(blogsFolderPath);

    // Extract blog data from each file
    const blogs = blogFiles.map(blogFile => {
        const blogFilePath = path.join(blogsFolderPath, blogFile);
        return JSON.parse(fs.readFileSync(blogFilePath, 'utf-8'));
    });

    // Check if a search query is provided
    const searchQuery = req.query.search;
    if (searchQuery) {
        // Filter blogs based on the search query (case-insensitive)
        const filteredBlogs = blogs.filter(blog => {
            const title = blog.title.toLowerCase();
            const content = blog.content.toLowerCase();
            return title.includes(searchQuery.toLowerCase()) || content.includes(searchQuery.toLowerCase());
        });

        console.log('Rendering blog list (filtered):', filteredBlogs); // Add this line for logging
        res.render('blog', { blogs: filteredBlogs, searchQuery });
    } else {
        console.log('Rendering blog list:', blogs); // Add this line for logging
        res.render('blog', { blogs, searchQuery: null });
    }
});


// Add this route for logout
app.get('/logout', (req, res) => {
    // Destroy the session to log out the user
    req.session.destroy(err => {
        if (err) {
            console.error('Error logging out:', err);
            res.json({ success: false, error: 'Internal server error' });
        } else {
            res.json({ success: true });
        }
    });
});


// Add this route for admin logout
app.get('/adminLogout', (req, res) => {
    // Destroy the session to log out the admin
    req.session.destroy(err => {
        if (err) {
            console.error('Error logging out admin:', err);
            res.json({ success: false, error: 'Internal server error' });
        } else {
            res.json({ success: true });
        }
    });
});



app.get('/getPaymentRequests', (req, res) => {
    try {
        const userData = JSON.parse(fs.readFileSync(userDataFilePath, 'utf-8'));
        const paymentRequests = userData
            .filter(user => user.hasOwnProperty('paymentRequested') && user.paymentRequested)
            .map(user => ({
                userName: user.fullname, // Assuming you have a 'name' property for users
                userEmail: user.email,
                creditCardNumber: user.creditCardNumber,
                requestedAmount: user.requested || 0, // Display the requested amount instead of the balance
            }));

        res.json({ success: true, paymentRequests });
    } catch (error) {
        console.error('Error fetching payment requests:', error);
        res.json({ success: false, error: 'Internal server error' });
    }
});


app.get('/markAsCompleted', (req, res) => {
    const userEmail = req.query.userEmail;

    try {
        const userData = JSON.parse(fs.readFileSync(userDataFilePath, 'utf-8'));
        const userIndex = userData.findIndex(user => user.email === userEmail);

        if (userIndex !== -1) {
            // Store the requested amount before resetting
            const requestedAmountBeforeCompletion = userData[userIndex].requested || 0;

            // Reset the 'paymentRequested' flag
            userData[userIndex].paymentRequested = false;

            // Remove the requested amount (set it to 0)
            userData[userIndex].requested = 0;

            // Update the 'allRequested' column
            if (userData[userIndex].hasOwnProperty('allRequested')) {
                userData[userIndex].allRequested += requestedAmountBeforeCompletion;
            } else {
                userData[userIndex].allRequested = requestedAmountBeforeCompletion;
            }

            // Save the updated user data to the file
            fs.writeFileSync(userDataFilePath, JSON.stringify(userData, null, 2));
            createPaymentRecord(userData[userIndex], requestedAmountBeforeCompletion);

            res.json({ success: true });
        } else {
            res.json({ success: false, error: 'User not found' });
        }
    } catch (error) {
        console.error('Error marking as completed:', error);
        res.json({ success: false, error: 'Internal server error' });
    }
});



function createPaymentRecord(user, requestedAmount) {
    const paymentsFolderPath = path.join(__dirname, 'payments');

    // Ensure the 'payments' folder exists
    if (!fs.existsSync(paymentsFolderPath)) {
        fs.mkdirSync(paymentsFolderPath);
    }

    // Create or read the payment records array
    const paymentRecordsFilePath = path.join(paymentsFolderPath, `${user.fullname.replace(/\s+/g, '_').toLowerCase()}.json`);
    let paymentRecords = [];

    if (fs.existsSync(paymentRecordsFilePath)) {
        const existingRecords = fs.readFileSync(paymentRecordsFilePath, 'utf8');
        try {
            paymentRecords = JSON.parse(existingRecords);
        } catch (error) {
            console.error('Error parsing existing payment records:', error);
        }
    }

    // Create a new payment record object
    const newPaymentRecord = {
        timeAndDate: new Date().toLocaleString(),
        creditCardNumber: user.creditCardNumber,
        requestedAmount,
    };

    // Add the new payment record to the array
    paymentRecords.push(newPaymentRecord);

    // Write the updated payment records array to the file
    fs.writeFileSync(paymentRecordsFilePath, JSON.stringify(paymentRecords, null, 2));

    console.log('Payment record created:', newPaymentRecord);
}




app.get('/inbox', isAuthenticated, (req, res) => {
    const userEmail = req.session.email;

    if (!userEmail) {
        res.status(401).send('Unauthorized');
        return;
    }

    try {
        const userData = JSON.parse(fs.readFileSync(userDataFilePath, 'utf-8'));
        const user = userData.find(user => user.email === userEmail);

        if (!user) {
            res.status(404).send('User not found');
            return;
        }

        const paymentsFolderPath = path.join(__dirname, 'payments');
        const paymentRecordsFilePath = path.join(paymentsFolderPath, `${user.fullname.replace(/\s+/g, '_').toLowerCase()}.json`);

        let paymentRecords = [];
        let isNewPaymentRecord = false; // Initialize the flag for new payment records

        if (fs.existsSync(paymentRecordsFilePath)) {
            const existingRecords = fs.readFileSync(paymentRecordsFilePath, 'utf8');
            paymentRecords = JSON.parse(existingRecords);
            paymentRecords.sort((a, b) => new Date(b.timeAndDate) - new Date(a.timeAndDate));

            // Check if there are new payment records
            if (hasNewPaymentRecord(paymentRecords, user.lastInboxCheck)) {
                isNewPaymentRecord = true;

                // Update user's lastInboxCheck timestamp to the latest payment record
                user.lastInboxCheck = paymentRecords[0].timeAndDate;

                // Save the updated user data
                const updatedUserData = userData.map(u => (u.email === user.email ? user : u));
                fs.writeFileSync(userDataFilePath, JSON.stringify(updatedUserData, null, 2));
            }
        }

        res.render('inbox', { paymentRecords, isNewPaymentRecord });
    } catch (error) {
        console.error('Error fetching or updating payment records:', error);
        res.status(500).send('Internal server error');
    }
});

// Helper function to check for new payment records
function hasNewPaymentRecord(records, lastCheckTimestamp) {
    if (records.length === 0 || !lastCheckTimestamp) {
        return false;
    }

    const latestRecordTimestamp = new Date(records[0].timeAndDate).getTime();
    return latestRecordTimestamp > lastCheckTimestamp;
}










// Route to handle payment requests
app.post('/requestPayment', (req, res) => {
    const userEmail = req.session.email;

    try {
        const userData = JSON.parse(fs.readFileSync(userDataFilePath, 'utf-8'));
        const userIndex = userData.findIndex(user => user.email === userEmail);

        if (userIndex !== -1) {
            if (userData[userIndex].paymentRequested) {
                return res.json({ success: false, error: 'Payment request already submitted. Please wait for processing.' });
            }

            if (userData[userIndex].balance < 2.5) {
                return res.json({ success: false, error: 'Insufficient balance for withdrawal. Minimum withdrawal amount is $2.5.' });
            }

            let requestedAmount = Math.min(userData[userIndex].balance, 5);

            const userEmailsInReferredUsers = userData
                .filter(user => user.referredUsers.includes(userEmail))
                .map(user => user.email);

            if (userEmailsInReferredUsers.length > 0) {
                const referralBonus = 0.5;
                const totalReferredAmount = userEmailsInReferredUsers.length * referralBonus;

                // Deduct the referral bonus from the requested amount
                requestedAmount -= totalReferredAmount;

                // Find the referrers and add the referral bonus to their balance
                userEmailsInReferredUsers.forEach(referredUserEmail => {
                    const referrer = userData.find(user => user.email === referredUserEmail);
                    if (referrer) {
                        // Deduct the referral bonus from the referred user's balance
                        const referredUser = userData.find(user => user.email === userEmail);
                        if (referredUser) {
                            referredUser.balance -= referralBonus;
                        }

                        // Add the referral bonus to the referrer's balance
                        referrer.balance += referralBonus;
                    }
                });
            }

            userData[userIndex].paymentRequested = true;
            userData[userIndex].requested = requestedAmount;

            if (!userData[userIndex].hasOwnProperty('allRequested')) {
                userData[userIndex].allRequested = 0;
            }

            userData[userIndex].allRequested += requestedAmount;
            userData[userIndex].balance -= requestedAmount;

            fs.writeFileSync(userDataFilePath, JSON.stringify(userData, null, 2));

            res.json({ success: true });
        } else {
            res.json({ success: false, error: 'User not found' });
        }
    } catch (error) {
        console.error('Error processing payment request:', error);
        res.json({ success: false, error: 'Internal server error' });
    }
});








app.get('/getBalance', (req, res) => {
    const userEmail = req.session.email;

    try {
        const userData = JSON.parse(fs.readFileSync(userDataFilePath, 'utf-8'));
        const user = userData.find(user => user.email === userEmail);

        if (user && user.hasOwnProperty('balance')) {
            res.json({ success: true, balance: user.balance });
        } else {
            res.json({ success: false, error: 'User not found or balance not available' });
        }
    } catch (error) {
        console.error('Error fetching balance:', error);
        res.json({ success: false, error: 'Internal server error' });
    }
});


app.get('/getRequestedAmount', (req, res) => {
    const userEmail = req.session.email;

    try {
        const userData = JSON.parse(fs.readFileSync(userDataFilePath, 'utf-8'));
        const user = userData.find(user => user.email === userEmail);

        if (user && user.hasOwnProperty('requested')) {
            res.json({ success: true, requestedAmount: user.requested });
        } else {
            res.json({ success: false, error: 'User not found or requested amount not available' });
        }
    } catch (error) {
        console.error('Error fetching requested amount:', error);
        res.json({ success: false, error: 'Internal server error' });
    }
});



app.get('/updateBalance', (req, res) => {
    const userEmail = req.session.email;
    const addedAmount = parseFloat(req.query.amount);

    try {
        const userData = JSON.parse(fs.readFileSync(userDataFilePath, 'utf-8'));
        const userIndex = userData.findIndex(user => user.email === userEmail);

        if (userIndex !== -1) {
            // Check if the 'balance' property exists for the user
            if (!userData[userIndex].hasOwnProperty('balance')) {
                userData[userIndex].balance = 0; // Initialize balance to 0 if it doesn't exist
            }

            userData[userIndex].balance += addedAmount;

            // Save the updated user data to the file
            fs.writeFileSync(userDataFilePath, JSON.stringify(userData, null, 2));

            res.json({ success: true });
        } else {
            res.json({ success: false, error: 'User not found' });
        }
    } catch (error) {
        console.error('Error updating balance:', error);
        res.json({ success: false, error: 'Internal server error' });
    }
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.use('/signup', signupRouter);

app.use('/login', loginRouter);

app.use('/settings', settingsRouter);

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/earn', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'earn.html'));
});

app.get('/earn2', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'earn2.html'));
});


app.get('/wallet', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'wallet.html'));
});


app.get('/admin', (req, res) => {
    res.send('Admin Page');
});

app.get('/about', (req, res) => {
    res.send('About Page');
});


app.get('/browser', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'browser.html'))
});

app.get('/load-content', async (req, res) => {
  try {
    const response = await fetch('https://bit.ly/47EdiJ1');
    const content = await response.text();
    res.send(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).send('Internal Server Error');
  }
});







// Middleware for handling undefined routes
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'error.html'));
});


// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
