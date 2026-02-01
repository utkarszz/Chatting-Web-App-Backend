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
   1. CORS CONFIGURATION
   ========================= */
// Professional tip: Explicitly defining the origin is safer for Cookie handling
const corsOptions = {
  origin: "https://chatting-web-app-frontend-three.vercel.app", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, // Required to allow cookies to be sent back and forth
};

/* =========================
   2. MIDDLEWARES (Order Matters!)
   ========================= */
app.use(cors(corsOptions));
app.use(cookieParser()); // Must be before routes to parse tokens for 'isAuthenticated'
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* =========================
   3. ROUTES
   ========================= */
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/message", messageRoutes);

// Health check route (Professional practice to check if backend is alive)
app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is up and running!" });
});

/* =========================
   4. HTTP + SOCKET SERVER
   ========================= */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://chatting-web-app-frontend-three.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

/* =========================
   5. SOCKET LOGIC
   ========================= */
const onlineUsers = new Map();

io.on("connection", (socket) => {
  // socket.handshake.query.userId allows you to get ID immediately on connect
  const userId = socket.handshake.query.userId;
  
  if (userId) {
    onlineUsers.set(userId, socket.id);
    console.log(`⚡ User Connected: ${userId} (Socket: ${socket.id})`);
  }

  // Update everyone on who is online
  io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));

  socket.on("disconnect", () => {
    if (userId) {
      onlineUsers.delete(userId);
      console.log(`❌ User Disconnected: ${userId}`);
      io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
    }
  });
});

/* =========================
   6. START SERVER
   ========================= */
// We connect to DB first, then start the server for a clean boot
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to DB:", error);
    process.exit(1); // Exit process with failure
  }
};

startServer();

/* =========================
   7. EXPORT SOCKET
   ========================= */
setSocket(io);