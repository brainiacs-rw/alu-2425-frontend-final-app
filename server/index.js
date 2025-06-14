// Import necessary modules
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { nanoid } = require('nanoid'); // For generating unique IDs
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const jwt = require('jsonwebtoken');

// Initialize Express app
const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'ALU Posts APP api documentation.',
            version: '1.0.0',
            description: 'A simple Express Posts API',
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./index.js'], // Path to the API docs
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- Database Setup (using SQLite) ---
const db = new sqlite3.Database('./posts.db');
const JWT_SECRET = 'your-super-secret-key-change-in-production';

const DUMMY_USER = {
    email: 'test@example.com',
    password: '$2a$10$X7UrH5YxX5YxX5YxX5YxX.5YxX5YxX5YxX5YxX5YxX5YxX5YxX'
};

// Database helper functions
function initializeDb() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS posts (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                photo TEXT NOT NULL,
                body TEXT NOT NULL,
                isFavourite INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) {
                    console.error('Error creating table:', err);
                    reject(err);
                } else {
                    console.log('Database initialized successfully');
                    resolve();
                }
            });
        });
    });
}

// Database query helpers
function getAllPosts() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM posts ORDER BY created_at DESC", (err, rows) => {
            if (err) {
                reject(err);
            } else {
                // Convert isFavourite from integer to boolean
                const posts = rows.map(row => ({
                    ...row,
                    isFavourite: Boolean(row.isFavourite)
                }));
                resolve(posts);
            }
        });
    });
}

function getPostById(id) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM posts WHERE id = ?", [id], (err, row) => {
            if (err) {
                reject(err);
            } else if (row) {
                // Convert isFavourite from integer to boolean
                resolve({
                    ...row,
                    isFavourite: Boolean(row.isFavourite)
                });
            } else {
                resolve(null);
            }
        });
    });
}

function createPost(post) {
    return new Promise((resolve, reject) => {
        const { id, title, description, photo, body, isFavourite } = post;
        db.run(
            "INSERT INTO posts (id, title, description, photo, body, isFavourite) VALUES (?, ?, ?, ?, ?, ?)",
            [id, title, description, photo, body, isFavourite ? 1 : 0],
            function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(post);
                }
            }
        );
    });
}

function updatePostFavorite(id, isFavourite) {
    return new Promise((resolve, reject) => {
        db.run(
            "UPDATE posts SET isFavourite = ? WHERE id = ?",
            [isFavourite ? 1 : 0, id],
            function (err) {
                if (err) {
                    reject(err);
                } else if (this.changes === 0) {
                    resolve(null); // No rows affected, post not found
                } else {
                    resolve(true);
                }
            }
        );
    });
}

// Replace the old token generation with JWT
function generateToken(user) {
    return jwt.sign(
        {
            email: user.email,
            // Add any other claims you want
            role: 'user',
            userId: '123' // In production, use real user ID
        },
        JWT_SECRET,
        { expiresIn: '24h' } // Token expires in 24 hours
    );
}

// Update the authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Authentication token required." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Add user info to request object
        next();
    } catch (error) {
        return res.status(403).json({ message: "Invalid or expired token." });
    }
}

// --- Routes ---

/**
 * @swagger
 * /:
 *   get:
 *     summary: Welcome message
 *     responses:
 *       200:
 *         description: Welcome message
 */
app.get('/', (req, res) => {
    res.send('Welcome to the Express Posts API! Refer to README.md for available endpoints.');
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login to get authentication token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 */
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required."
        });
    }

    try {


        // Generate JWT token
        const token = generateToken({ email });

        res.json({
            message: "Login successful",
            token,
            user: {
                email,
                role: 'user'
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            message: "An error occurred during login."
        });
    }
});

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get all posts
 *     responses:
 *       200:
 *         description: List of all posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   photo:
 *                     type: string
 *                   body:
 *                     type: string
 *                   isFavourite:
 *                     type: boolean
 *                   created_at:
 *                     type: string
 */
app.get('/posts', async (req, res) => {
    try {
        const posts = await getAllPosts();
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: "Error reading posts", error: error.message });
    }
});

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Get a post by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post details
 *       404:
 *         description: Post not found
 */
app.get('/posts/:id', async (req, res) => {
    try {
        const post = await getPostById(req.params.id);
        if (post) {
            res.json(post);
        } else {
            res.status(404).json({ message: "Post not found." });
        }
    } catch (error) {
        res.status(500).json({ message: "Error reading post", error: error.message });
    }
});

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - photo
 *               - body
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               photo:
 *                 type: string
 *               body:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Authentication required
 */
app.post('/posts', authenticateToken, async (req, res) => {
    const { title, description, photo, body } = req.body;

    // Basic validation
    if (!title || !description || !photo || !body) {
        return res.status(400).json({ message: "Missing required fields: title, description, photo, and body are required." });
    }

    try {
        const newPost = {
            id: nanoid(), // Generate a unique ID for the post
            title,
            description,
            photo, // Expecting a URL string
            body,
            isFavourite: false // Default to not favorited
        };

        await createPost(newPost);
        res.status(201).json({ message: "Post added successfully", post: newPost });
    } catch (error) {
        res.status(500).json({ message: "Error creating post", error: error.message });
    }
});

/**
 * @swagger
 * /posts/{id}/favorite:
 *   post:
 *     summary: Add a post to favorites
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post added to favorites
 *       404:
 *         description: Post not found
 */
app.post('/posts/:id/favorite', async (req, res) => {
    try {
        const result = await updatePostFavorite(req.params.id, true);

        if (result) {
            const updatedPost = await getPostById(req.params.id);
            res.json({ message: "Post added to favorites", post: updatedPost });
        } else {
            res.status(404).json({ message: "Post not found." });
        }
    } catch (error) {
        res.status(500).json({ message: "Error updating favorite", error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    // Log the error for debugging
    console.error('Error:', err);

    // Default error status and message
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';

    // Send error response
    res.status(status).json({
        error: {
            message,
            status,
            // Only include stack trace in development
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
});

// 404 handler - must be after all other routes
app.use((req, res) => {
    res.status(404).json({
        error: {
            message: 'Route not found',
            status: 404
        }
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Closing database connection...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});

// Start the server
async function startServer() {
    try {
        await initializeDb();
        app.listen(port, () => {
            console.log(`Express Posts API listening at http://localhost:${port}`);
            console.log(`API Documentation available at http://localhost:${port}/api-docs`);
            console.log('To run this app:');
            console.log('1. Ensure Node.js and npm are installed.');
            console.log('2. Navigate to the project directory in your terminal.');
            console.log('3. Run `npm install express sqlite3 nanoid swagger-jsdoc swagger-ui-express` to install dependencies.');
            console.log('4. Run `node app.js` to start the server.');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();