
const express = require("express");
const cors = require("cors");
const { xss } = require("express-xss-sanitizer");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const hpp = require("hpp");
const rateLimit = require('express-rate-limit');
const globalErrorHandler = require("../utils/errorHandler");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");

// routes
const authRoutes = require('../routes/auth');
const projectRoutes = require('../routes/projects');
const taskRoutes = require('../routes/tasks');
const commentRoutes = require('../routes/comments');

const app = express();
// socket handlers
const { socketHandlers } = require("../socket/handlers");
const appError = require("../utils/appError");

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin:"*",
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
});

app.set("trust proxy", true);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());


app.use(hpp());
app.use(xss());

// Content Security Policy
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "trusted-scripts.com"],
            connectSrc: [
                "'self'", 
                "ws:", 
                "wss:", 
                "http://127.0.0.1:3001", 
                "http://localhost:3001",
                process.env.NODE_ENV === 'production' ? process.env.SERVER_URL : ""
            ].filter(Boolean),
            imgSrc: ["'self'", "data:", "https:"],
            styleSrc: ["'self'", "'unsafe-inline'"],
        },
    })
);


// Serve uploaded files
// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting (uncomment for production)
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More lenient in development
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
}));



// Health check endpoint
app.use("/api/v1/healthCheck", (req, res) => {
    return res.status(200).json({
        status: true,
        message: "Health is OK",
        timestamp: new Date().toISOString(),
        socketConnections: io.sockets.sockets.size
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);

// Handle 404 for API routes
app.use( (req, res, next) => {
    next(new appError(`API route not found: ${req.originalUrl}`, 404));
});

// // Serve frontend in production
// if (process.env.NODE_ENV === 'production') {
//     app.use(express.static(path.join(__dirname, '../../frontend/dist')));
    
//     app.get('*', (req, res) => {
//         res.sendFile(path.resolve(__dirname, '../../frontend/dist/index.html'));
//     });
// }

// Catch-all for non-API routes in development
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        next(new appError("API endpoint not found", 404));
    } else {
        res.status(404).json({ 
            message: "Route not found",
            path: req.path 
        });
    }
});

app.use(globalErrorHandler);

module.exports = { app, server };