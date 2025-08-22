const express=require("express");
const cors=require("cors");
const { xss } =require("express-xss-sanitizer")
const helmet=require("helmet");
const cookieParser=require("cookie-parser");
const hpp = require("hpp");
const rateLimit = require('express-rate-limit');
const globalErrorHandler= require("../utils/errorHandler");
const { createServer }= require("http");
const { Server }= require("socket.io")
const path= require("path")

// routes

const authRoutes = require('../routes/auth');
const projectRoutes = require('../routes/projects');
const taskRoutes = require('../routes/tasks');
const commentRoutes = require('../routes/comments');

const app=express();
// socket handlers
const socketHandlers= require("../socket/handlers");
const appError = require("../utils/appError");
const server= createServer(app);
const io= new Server(server,{
    cors:{origin:"url", methods: ["GET", "POST"]
    }
})
// console.log(1)

app.set("trust proxy", true);
app.use(express.json({limit:"10mb"}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());
app.use(hpp());
app.use(xss());
app.use(helmet());
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "trusted-scripts.com"],
        },
    })
);
// console.log(1)

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// console.log(1)


app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
}));

socketHandlers(io);


app.use("/api/v1/healthCheck", (req, res) => {
    return res.status(200).json({
        status: true,
        message: "Health is OK",
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);

app.use((req, res, next) => {
    next(new appError("PATH NOT FOUND"));
});

app.use(globalErrorHandler);

module.exports = app;