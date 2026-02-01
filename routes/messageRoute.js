import express from "express";
import multer from "multer";
import { sendMessage, getMessage, getConversations } from "../controllers/messageController.js";
import isAuthenticated from "../middleware/isAuthenticated.js";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

router.route("/send/:id").post(isAuthenticated, upload.single("file"), sendMessage);
router.route("/conversations").get(isAuthenticated, getConversations);
router.route("/:id").get(isAuthenticated, getMessage);

export default router;