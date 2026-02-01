import mongoose from "mongoose";

const messageModel = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  message: {
    type: String,
    required: true
  },
  attachment: {
    name: String,
    type: String,
    data: String // Base64 encoded data
  }
 },{ timestamps: true });

export const Message = mongoose.model("Message", messageModel);