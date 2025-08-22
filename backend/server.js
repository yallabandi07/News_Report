const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3039;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from project root
app.use(express.static(path.join(__dirname, '../')));

// Database setup
const db = new sqlite3.Database(path.join(__dirname, 'users.db'), (err) => {
    if (err) console.error(err.message);
    else console.log('Connected to SQLite database.');
});

// Create users table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT
)`);

// Route to serve login/signup page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../login.html'));
});

// Login route
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) return res.redirect('/login?error=Database+error');
        if (!user) return res.redirect('/login?error=User+not+found.+Please+signup+first');
        if (user.password !== password) return res.redirect('/login?error=Incorrect+password');

        // Successful login
        res.redirect('/pages/home2.html');
    });
});

// Signup route
app.post('/signup', (req, res) => {
    const { email, password, Confirm_password } = req.body;

    if (password !== Confirm_password) {
        return res.redirect('/login?error=Passwords+do+not+match');
    }

    db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, password], (err) => {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.redirect('/login?error=Email+already+registered');
            }
            return res.redirect('/login?error=Database+error');
        }

        // Successful signup
        res.redirect('/pages/home2.html');
    });
});

// Optional: serve home2.html directly
app.get('/pages/home2.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../pages/home2.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
