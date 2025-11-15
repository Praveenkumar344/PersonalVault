// backend/src/server.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth";
import dashboard from "./routes/dashboard";
import fileRoutes from "./routes/files";

dotenv.config();
const app = express();

// connect DB
connectDB();

// helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "connect-src": [
          "'self'",
          process.env.FRONTEND_URL || "http://localhost:5173",
        ],
        "img-src": ["'self'", "data:", "https:"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
  })
);

// rate limit (global)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests, try again later.",
});
app.use(limiter);
console.log("🔥 HIT REFRESH ENDPOINT");

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        "http://localhost:5173",
        "http://localhost:5173/",
        process.env.FRONTEND_URL?.replace(/\/$/, ""),
      ];

      if (!origin || allowed.includes(origin.replace(/\/$/, ""))) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    exposedHeaders: ["Content-Disposition"],
  })
);

console.log("🔥 HIT REFRESH ENDPOINT HIT REFRESH ENDPOINT");


// body parser + cookies
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// sanitize only body & params (Express v5 compatibility)
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
});

app.disable("x-powered-by");

// routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboard);
app.use("/api/files", fileRoutes);

app.get("/", (_req, res) => res.send("✅ PersonalVault Backend is running"));

// error handler
app.use(
  (err: any, _req: express.Request, res: express.Response, _next: any) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
