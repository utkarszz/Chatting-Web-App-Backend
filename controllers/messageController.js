import { Conversation } from "../models/conversationModel.js";
import { Message } from "../models/messageModel.js";
import { getIO } from "../socket.js";

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.id;
    const receiverId = req.params.id;
    const { message } = req.body;
    const file = req.file;

    // Find or create conversation
    let gotConversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!gotConversation) {
      gotConversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    // Create new message with optional attachment
    const messageData = {
      senderId,
      receiverId,
      message,
    };

    if (file) {
      // Convert file buffer to base64 for storage (since using memory storage)
      const base64Data = file.buffer.toString('base64');
      messageData.attachment = {
        name: file.originalname,
        type: file.mimetype,
        data: base64Data,
      };
    }

    const newMessage = await Message.create(messageData);

    if (newMessage) {
      gotConversation.messages.push(newMessage._id);
      await gotConversation.save();

      const io = getIO();

      // Emit to both sender & receiver rooms
      io.to(senderId.toString()).emit("message", newMessage);
      io.to(receiverId.toString()).emit("message", newMessage);
    }

    return res.status(200).json({
      message: "Message sent successfully",
      newMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get all messages between logged-in user and another user
export const getMessage = async (req, res) => {
  try {
    const receiverId = req.params.id;
    const senderId = req.id;

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    }).populate("messages");

    if (!conversation) {
      return res.status(200).json([]);
    }

    return res.status(200).json(conversation.messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get all conversations for logged-in user
export const getConversations = async (req, res) => {
  try {
    const userId = req.id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "username fullName profilePhoto")
      .populate({
        path: "messages",
        options: { sort: { createdAt: -1 }, limit: 1 },
      })
      .sort({ updatedAt: -1 });

    // Format conversations to include other user info and last message
    const formattedConversations = conversations.map((conv) => {
      const otherUser = conv.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );
      const lastMessage = conv.messages[0] || null;

      return {
        _id: conv._id,
        user: otherUser,
        lastMessage: lastMessage
          ? {
              message: lastMessage.message,
              createdAt: lastMessage.createdAt,
              senderId: lastMessage.senderId,
            }
          : null,
        updatedAt: conv.updatedAt,
      };
    });

    return res.status(200).json(formattedConversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
