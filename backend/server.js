// Force node to resolve with this dns
const dns = require("node:dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
// Load env vars MUST BE FIRST
dotenv.config();

const cors = require("cors");
const morgan = require("morgan");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;

const connectDB = require("./config/db");

//Define routes
const userRoutes = require("./routes/userRoutes");
const courseRoutes = require("./routes/courseRoutes");
const sectionRoutes = require("./routes/sectionRoutes");
const definitionRoutes = require("./routes/definitionRoutes");

// Establishes connection to MongoDB Atlas
let dbUrl = process.env.MONGO_URI;

if (process.env.NODE_ENV === "loadtest") {
  dbUrl = "mongodb://127.0.0.1:27017/test_db_load";
}

connectDB(dbUrl);

const app = express();

/**
 * Middleware Configuration
 */
// Allows the server to accept and parse JSON data in request bodies
app.use(express.json());

// HTTP request logger middleware for development environment
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Enables Cross-Origin Resource Sharing (allows frontend to talk to backend)
// need to explicity set credentials true for session cookies
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// session middleware setup to generate session ID
// store in Mongo and send cookies in response header
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl:
        process.env.NODE_ENV === "loadtest"
          ? "mongodb://127.0.0.1:27017/test_db_load"
          : process.env.MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

//Send requests to routes, if the request is for /api/v1/courses, it will go to courseRoutes, if the request is for /api/v1/user, it will go to userRoutes
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/sections", sectionRoutes);
app.use("/api/v1/definitions", definitionRoutes);

// serve Vite frontend build in production
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../frontend/dist");
  app.use(express.static(frontendPath));

  app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("CRAM API is running...");
  });
}

// Define server port (defaults to 5000 if not specified in .env)
const PORT = process.env.PORT || 5000;

// Start the Express server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
