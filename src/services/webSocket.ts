import { io } from "../app";
import { Socket } from "socket.io";
import socketioJwt from "socketio-jwt";
import "./env";

import User from "../models/User";
import Chat from "../models/Chat";
import Message from "../models/Message";

interface CustomSocket extends Socket {
  data: {
    userId: string;
    passwordVersion: number;
    iat: number;
    exp: number;
  };
}

io.use(
  socketioJwt.authorize({
    secret: process.env.SECRET,
    handshake: true,
    decodedPropertyName: "data",
  })
);

io.on("connection", async (socket: CustomSocket) => {
  const user = await User.findById(socket.data.userId);
  socket.join(user._id.toString());

  socket.on("getUsersOnline", async () => {
    const { chats } = await User.findById(user._id);

    chats.forEach(async (chatId) => {
      const chat = await Chat.findById(chatId);
      const otherUser = chat.users.find((userId) => userId !== user._id);

      socket.broadcast
        .to(otherUser.toString())
        .emit("userOnlineVerify", { chatId: chat._id, userId: user._id });
    });
  });

  socket.on("userAlreadyOnline", ({ chatId, userId }) => {
    socket.broadcast.to(userId.toString()).emit("userOnline", { chatId });
  });

  socket.on("chatDeleted", ({ chatId, userId }) => {
    socket.broadcast.to(userId.toString()).emit("removeChat", { chatId });
  });

  socket.on("readAllLastMessages", async ({ chatId, userId }) => {
    await Message.updateMany(
      { chatId, readed: false, author: userId },
      { $set: { readed: true } }
    );

    socket.to(userId.toString()).emit("lastMessagesReaded", { chatId });
  });

  socket.on("createNewChatRequest", async ({ userId }) => {
    socket.broadcast.to(userId.toString()).emit("newChatRequest");
  });

  socket.on("createNewChat", async ({ chatId }) => {
    const newChat = await Chat.findById(chatId).populate("users");

    if (newChat) {
      const otherUser = newChat.users.find(
        (userToSearch) => userToSearch._id !== user._id
      );

      const chat = {
        _id: newChat._id,
        user: otherUser,
      };

      socket.broadcast.to(otherUser._id.toString()).emit("newChat", { chat });
    }
  });

  socket.on("sendMessage", async ({ content, chatId }) => {
    const messageData = {
      author: user._id,
      date: new Date(Date.now()),
      chatId,
      content,
    };

    const message = await Message.create(messageData);

    const chat = await Chat.findByIdAndUpdate(chatId, {
      $push: { messages: message._id },
    });

    const userToSend = chat.users.find(
      (userId) => userId.toString() !== user._id.toString()
    );

    socket
      .to(userToSend.toString())
      .emit("message", { content, chatId, userId: user._id });

    socket.emit("message", { content, chatId, userId: user._id });
  });

  socket.on("disconnect", () => {
    user.chats.forEach(async (chatId) => {
      const chat = await Chat.findById(chatId);

      console.log("user disconnected")

      if (chat) {
        const otherUser = chat.users.find((userId) => userId !== user._id);

        if (otherUser) {
          socket.broadcast
            .to(otherUser.toString())
            .emit("userDisconnect", { chatId: chat._id });
        }
      }
    });
  });
});
