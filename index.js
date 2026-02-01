import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoute.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { setSocket } from "./socket.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* =========================
   1. DYNAMIC CORS CONFIG (Fixes the ERR_FAILED)
   ========================= */
const allowedOrigins = [
  "https://chatting-web-app-frontend-three.vercel.app",
  "http://localhost:5173", // For local development
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    // Check if origin is in our list OR is a Vercel preview URL
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, // Crucial for req.cookies
};

/* =========================
   2. MIDDLEWARES
   ========================= */
app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

/* =========================
   3. ROUTES
   ========================= */
// Health check at root (helpful to verify if deployment is live)
app.get("/", (req, res) => {
  res.status(200).send("Backend Server is Live and Running!");
});

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/message", messageRoutes);

/* =========================
   4. HTTP + SOCKET SERVER
   ========================= */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(new Error("Socket CORS Error"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

/* =========================
   5. SOCKET LOGIC
   ========================= */
const onlineUsers = new Map();

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  
  if (userId && userId !== "undefined") {
    onlineUsers.set(userId, socket.id);
    console.log(`⚡ User Online: ${userId}`);
  }

  io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));

  socket.on("disconnect", () => {
    if (userId) {
      onlineUsers.delete(userId);
      console.log(`❌ User Offline: ${userId}`);
      io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
    }
  });
});

/* =========================
   6. START SERVER
   ========================= */
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("DB Connection Failed:", error);
    process.exit(1);
  }
};

startServer();

setSocket(io);