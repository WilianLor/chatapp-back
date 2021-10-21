import { Request, Response } from "express";

import User from "../models/User";
import ChatRequest from "../models/RequestRequest";
import Chat from "../models/Chat";
import Message from "../models/Message";

import getTokenParams from "../functions/getTokenParams";

export default {
  async sendChatRequest(req: Request, res: Response) {
    const { authorization } = req.headers;
    const { userId } = getTokenParams(authorization);
    const { id } = req.body;

    try {
      const userSender = await User.findById(userId);

      if (!userSender) {
        return res.json({
          status: "error",
          message: "USUÁRIO não encontrado!",
        });
      }

      const userReceiver = await User.findById(id);

      if (!userReceiver) {
        return res.json({
          status: "error",
          message: "O ID do usuário é inválido!",
        });
      }

      if (id === userId) {
        return res.json({
          status: "error",
          message: "O REMETENTE e o RECEPTOR é o mesmo usuário!",
        });
      }

      if (
        (await ChatRequest.findOne({
          sender: userSender._id,
          receiver: userReceiver._id,
        })) ||
        (await ChatRequest.findOne({
          sender: userReceiver._id,
          receiver: userSender._id,
        }))
      ) {
        return res.json({
          status: "error",
          message: "Já EXISTE um pedido conversa entre estes usuários!",
        });
      }

      if (
        await Chat.findOne({
          users: { $all: [userSender._id, userReceiver._id] },
        })
      ) {
        return res.json({
          status: "error",
          message: "Já EXISTE uma conversa entre estes usuários!",
        });
      }

      const requestData = {
        sender: userSender._id,
        receiver: userReceiver._id,
      };

      await ChatRequest.create(requestData);

      return res.status(200).json({
        status: "success",
        message: "O pedido de CONVERSA foi enviado com sucesso!",
      });
    } catch (err) {
      return res.status(500);
    }
  },

  async actionChatRequest(req: Request, res: Response) {
    const { authorization } = req.headers;
    const { requestId, action } = req.body;

    const { userId } = getTokenParams(authorization);

    if (action !== "confirm" && action !== "decline") {
      return res.json({
        status: "error",
        message: "O conteúdo da AÇÃO é obrigatório!",
      });
    }

    try {
      const user = await User.findById(userId);

      if (!user) {
        return res.json({ status: "error", message: "Este TOKEN é inválido!" });
      }

      const request = await ChatRequest.findById(requestId);

      if (!request) {
        return res.json({
          status: "error",
          message: "Este PEDIDO DE CONVERSA não existe!",
        });
      }

      if (!request.receiver === user._id) {
        return res.json({
          status: "error",
          message: "Você NÃO ENVIOU este pedido de conversa!",
        });
      }

      if (action === "confirm") {
        const userSender = await User.findById(request.sender);

        const chatData = {
          users: [userSender._id, user._id],
        };

        const chat = await Chat.create(chatData);

        await User.findByIdAndUpdate(user._id, {
          $push: { chats: chat._id },
        });

        await User.findByIdAndUpdate(userSender._id, {
          $push: { chats: chat._id },
        });

        await ChatRequest.findByIdAndDelete(request._id);

        return res.json({
          status: "success",
          message: "Conversa CRIADA com sucesso!",
          chatId: chat._id,
        });
      } else {
        await ChatRequest.findByIdAndDelete(request._id);

        return res.json({
          status: "success",
          message: "Pedido de conversa REMOVIDO com sucesso!",
        });
      }
    } catch (err) {
      return res.status(500);
    }
  },

  async getChatRequests(req: Request, res: Response) {
    const { authorization } = req.headers;
    const { userId } = getTokenParams(authorization);

    try {
      const user = await User.findById(userId);

      const chatsRequests = await ChatRequest.find({
        receiver: user._id,
      }).populate(["sender", "receiver"]);

      return res.status(200).json({
        status: "success",
        chatsRequests,
      });
    } catch (err) {
      return res.status(500);
    }
  },

  async removeChat(req: Request, res: Response) {
    const { authorization } = req.headers;
    const { userId } = getTokenParams(authorization);

    const { chatId } = req.body;

    try {
      const user = await User.findById(userId);

      if (!user) {
        return res.json({
          status: "error",
          message: "Este ID de usuário é inválido!",
        });
      }

      const chat = await Chat.findById(chatId);

      if (!chat) {
        return res.json({
          status: "error",
          message: "Esta conversa não EXISTE!",
        });
      }

      const users = chat.users;

      const otherUser = users.find((id) => id !== user._id);

      await User.findByIdAndUpdate(otherUser, {
        $pull: { chats: chat._id },
      });

      await User.findByIdAndUpdate(user._id, {
        $pull: { chats: chat._id },
      });

      await Message.deleteMany({ chatId: chat._id });

      await Chat.findByIdAndDelete(chat._id);

      return res.status(200).json({
        status: "success",
        message: "O chat foi APAGADO com sucesso!",
      });
    } catch (err) {
      return res.status(500);
    }
  },

  async getAllChats(req: Request, res: Response) {
    const { authorization } = req.headers;
    const { userId } = getTokenParams(authorization);

    try {
      const user = await User.findById(userId)
        .populate({
          path: "chats",
          populate: {
            path: "messages",
          },
        })
        .populate({
          path: "chats",
          populate: {
            path: "users",
          },
        });

      const chats = [];

      user.chats.forEach((chat) => {
        chats.push(chat);
      });

      return res.json({
        status: "success",
        chats,
      });
    } catch (err) {
      return res.status(500);
    }
  },
};
