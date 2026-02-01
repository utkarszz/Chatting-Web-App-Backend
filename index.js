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
   CORS CONFIG (FINAL)
========================= */

const allowedOrigins = [
  "https://chatting-web-app-frontend-three.vercel.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app")
    ) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

/* =========================
   MIDDLEWARES
========================= */

app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

/* =========================
   ROUTES
========================= */

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/message", messageRoutes);

/* =========================
   HTTP + SOCKET SERVER
========================= */

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

/* =========================
   SOCKET LOGIC
========================= */

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("⚡ Client connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    onlineUsers.set(userId, socket.id);

    socket.emit("onlineUsers", Array.from(onlineUsers.keys()));
    socket.broadcast.emit("userOnline", userId);
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        io.emit("userOffline", userId);
        break;
      }
    }
    console.log("❌ Client disconnected:", socket.id);
  });
});

/* =========================
   START SERVER
========================= */

server.listen(PORT, async () => {
  await connectDB();
  console.log(`🚀 Server running on port ${PORT}`);
});

/* =========================
   EXPORT SOCKET
========================= */

setSocket(io);