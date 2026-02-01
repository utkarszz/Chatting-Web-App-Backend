let io;

export const setSocket = (ioInstance) => {
  io = ioInstance;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
