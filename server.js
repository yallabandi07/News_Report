const http = require('http');
const fs = require('fs');
const url = require('url');
const querystring = require('querystring');
const sqlite3 = require('sqlite3').verbose();

const PORT = process.env.PORT || 3039;

// SQLite database setup
const dbPath = './data.db';
const dbExists = fs.existsSync(dbPath);
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        if (!dbExists) {
            console.log('Database does not exist. Creating a new one...');
            createTables(db);
        } else {
            console.log('Connected to the database');
        }

        // Start the server after the database connection is established
        startServer();
    }
});

// Function to create necessary tables if they don't exist
function createTables(db) {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            email TEXT UNIQUE,
            password TEXT
        )`, (err) => {
            if (err) {
                console.error('Error creating users table:', err.message);
            } else {
                console.log('Users table created successfully');
            }
        });
    });
}

// Start the HTTP server
function startServer() {
    const server = http.createServer((req, res) => {
        const path = url.parse(req.url).pathname;

        if (path === '/' && req.method === 'GET') {
            fs.readFile('login.html', (err, data) => {
                if (err) {
                    console.error('Error reading login.html:', err);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal Server Error');
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(data);
                }
            });
        } else if (path === '/login' && req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
                if (typeof chunk === 'string' || chunk instanceof Buffer) {
                    body += chunk.toString();
                } else {
                    console.error('Unexpected data type received:', typeof chunk);
                }
            });
        
            req.on('end', () => {
                try {
                    const formData = querystring.parse(body);
                    const { email, password } = formData;
                    authenticateUser(email, password, (err, isAuthenticated) => {
                        if (err) {
                            console.error('Error authenticating user:', err);
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Internal Server Error');
                        } else {
                            if (!isAuthenticated) {
                                res.writeHead(200, { 'Content-Type': 'text/plain' });
                                res.end('Invalid user or password');
                            } else {
                                // User authenticated, redirect to home page
                                res.writeHead(302, { 'Location': '/home2.html' });
                                res.end();
                            }
                        }
                    });
                } catch (err) {
                    console.error('Error parsing request data:', err);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal Server Error');
                }
            });
        } else if (path === '/signup' && req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
                if (typeof chunk === 'string' || chunk instanceof Buffer) {
                    body += chunk.toString();
                } else {
                    console.error('Unexpected data type received:', typeof chunk);
                }
            });

            req.on('end', () => {
                try {
                    const formData = querystring.parse(body);
                    const { email, password, confirm_password } = formData;

                    createUser(email, password, (err, result) => {
                        if (err) {
                            console.error('Error creating user:', err);
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Internal Server Error');
                        } else {
                            res.writeHead(302, { 'Location': result.redirectTo });
                            res.end();
                        }
                    });
                } catch (err) {
                    console.error('Error parsing request data:', err);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal Server Error');
                }
            });
        } else {
            fs.readFile('.' + path, (err, data) => {
                if (err) {
                    console.error('Error reading file:', err);
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('File Not Found');
                } else {
                    res.writeHead(200);
                    res.end(data);
                }
            });
        }
    });

    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

// Function to authenticate user
function authenticateUser(email, password, callback) {
    db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, row) => {
        if (err) {
            callback(err, false);
        } else {
            // Check if row exists and the user is authenticated
            const isAuthenticated = !!row;
            callback(null, { redirectTo: '/home2.html' });
        }
    });
}

// Function to create a new user
function createUser(email, password, callback) {
    db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, password], function(err) {
        if (err) {
            callback(err);
        } else {
            callback(null, { redirectTo: '/home2.html' });
        }
    });
}