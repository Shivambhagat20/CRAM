const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const session = require("express-session");
const MongoStore = require("connect-mongo").default;

//Define routes
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const sectionRoutes = require('./routes/sectionRoutes');
const definitionRoutes = require('./routes/definitionRoutes');

// Load env vars
dotenv.config();

// Establishes connection to MongoDB Atlas
connectDB();

const app = express();

/**
 * Middleware Configuration
 */
// Allows the server to accept and parse JSON data in request bodies
app.use(express.json());

// Enables Cross-Origin Resource Sharing (allows frontend to talk to backend)
// need to explicity set credentials true for session cookies
app.use(cors({
    origin: "http://localhost:5173", // frontend URL
    credentials: true
}));

// HTTP request logger middleware for development environment
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// session middleware setup to generate session ID
// store in Mongo and send cookies in response header
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: "sessions"
    }),
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

//Send requests to routes, if the request is for /api/v1/courses, it will go to courseRoutes, if the request is for /api/v1/user, it will go to userRoutes
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/sections', sectionRoutes);
app.use('/api/v1/definitions', definitionRoutes);

app.get('/', (req, res) => {
    res.send('CRAM API is running...');
});


// Define server port (defaults to 5000 if not specified in .env)
const PORT = process.env.PORT || 5000;

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
