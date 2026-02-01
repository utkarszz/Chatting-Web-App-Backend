import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoute.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import { setSocket } from "./socket.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// middleware
app.use(cors({
  origin: true, // Vite frontend
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/message", messageRoutes);

// create http server
const server = http.createServer(app);

// attach socket.io
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

// Track online users
const onlineUsers = new Map();

// socket.io connection
io.on("connection", (socket) => {
  console.log("⚡ New client connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    onlineUsers.set(userId, socket.id);
    
    // Send current online users list to the newly connected user
    const onlineUserIds = Array.from(onlineUsers.keys());
    socket.emit("onlineUsers", onlineUserIds);
    
    // Broadcast to all other clients that this user is online
    socket.broadcast.emit("userOnline", userId);
    console.log(`User ${userId} joined room`);
  });

  // Removed redundant message handler - messages are emitted via messageController

  socket.on("disconnect", () => {
    // Find which user disconnected
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        io.emit("userOffline", userId);
        console.log(`User ${userId} went offline`);
        break;
      }
    }
    console.log("❌ Client disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on port ${PORT}`);
});


// export io so controllers can use it
setSocket(io);