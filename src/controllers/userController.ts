import { Request, Response } from "express";
import bcrypt from "bcryptjs";

import User from "../models/User";

import validateMail from "../functions/validateMail";
import generateToken from "../functions/generateToken";
import getTokenParams from "../functions/getTokenParams";
import sentResetToken from "../functions/sentResetToken";

export default {
  async create(req: Request, res: Response) {
    const { name, email, password } = req.body;

    if (!name) {
      return res.json({
        status: "error",
        message: "O NOME do usuário é obrigatório!",
      });
    }

    if (!email) {
      return res.json({
        status: "error",
        message: "O EMAIL do usuário é obrigatório!",
      });
    }

    if (!validateMail(email)) {
      return res.json({
        status: "error",
        message: "Este EMAIL é obrigatório!",
      });
    }

    if (!password) {
      return res.json({ status: "error", message: "A SENHA é obrigatória!" });
    }

    if (password.length < 6) {
      return res.json({
        status: "error",
        message: "Esta SENHA é muito curta!",
      });
    }

    try {
      if (await User.findOne({ name })) {
        return res.json({
          status: "error",
          message: "Este NOME de usuário ja está em uso!",
        });
      }

      if (await User.findOne({ email })) {
        return res.json({
          status: "error",
          message: "Este EMAIL ja está em uso!",
        });
      }

      const userData = {
        name,
        email: email.toLowerCase(),
        password,
      };

      const user = await User.create(userData);

      return res.status(201).json({
        status: "success",
        id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken({
          userId: user._id,
          passwordVersion: user.passwordVersion,
        }),
      });
    } catch (err) {
      return res.status(500);
    }
  },

  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email) {
      return res.json({ status: "error", message: "O EMAIL é obrigatório!" });
    }

    if (!password) {
      return res.json({ status: "error", message: "A SENHA é obrigatória!" });
    }

    if (!validateMail(email)) {
      return res.json({
        status: "error",
        message: "Este EMAIL é obrigatório!",
      });
    }

    try {
      const user = await User.findOne({ email: email.toLowerCase() })
        .select("+password")
        .select("+passwordVersion");

      if (!user) {
        return res.json({ status: "error", message: "EMAIL não encontrado!" });
      }

      if (!(await bcrypt.compare(password, user.password))) {
        return res.json({
          status: "error",
          message: "As SENHAS não conferem!",
        });
      }

      return res.status(200).json({
        status: "success",
        id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken({
          userId: user._id,
          passwordVersion: user.passwordVersion,
        }),
      });
    } catch (err) {
      return res.status(500);
    }
  },

  async getData(req: Request, res: Response) {
    const { authorization } = req.headers;
    const { userId, passwordVersion } = getTokenParams(authorization);

    try {
      const user = await User.findById(userId).select("+passwordVersion");

      if (!user) {
        return res.status(200).json({
          status: "error",
          message: "USUÁRIO não encontrado!",
        });
      }

      if (passwordVersion !== user.passwordVersion) {
        return res.status(200).json({
          status: "error",
          message: "A SENHA foi alterada!",
        });
      }

      return res.status(200).json({
        status: "success",
        id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken({
          userId: user._id,
          passwordVersion: user.passwordVersion,
        }),
      });
    } catch (err) {
      return res.status(500);
    }
  },

  async getWithFilter(req: Request, res: Response) {
    const { limit = 10, page = 1, search = "" } = req.query;
    const { authorization } = req.headers;
    const { userId } = getTokenParams(authorization);

    try {
      const users = await User.find();

      const filteredUsers = users.filter(
        (user) =>
          user.name
            .toLowerCase()
            .includes(search.toString().toLocaleLowerCase()) &&
          user._id.toString() !== userId
      );

      const resultUsers = filteredUsers.slice(
        Number(limit) * (Number(page) - 1),
        Number(limit) * Number(page)
      );

      const totalOfPages = Math.ceil(filteredUsers.length / Number(limit));

      return res.status(200).json({
        status: "success",
        users: resultUsers,
        totalOfPages: totalOfPages,
      });
    } catch (err) {
      return res.status(500);
    }
  },

  async sendResetPasswordToken(req: Request, res: Response) {
    const { email } = req.body;

    try {
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(200).json({
          status: "error",
          message: "Não foi encontrado uma conta com este EMAIL!",
        });
      }

      let expiresDate = new Date(Date.now());

      expiresDate.setMinutes(expiresDate.getMinutes() + 5);

      const token = (Math.floor(Math.random() * 90000) + 10000).toString();

      await sentResetToken({ to: user.email, resetToken: token });

      const hash = await bcrypt.hash(token, 10);

      await User.findByIdAndUpdate(user.id, {
        $set: {
          passwordResetToken: hash,
          passwordResetExpires: expiresDate,
        },
      });

      return res.status(200).json({
        status: "success",
        message: "Token de recuperação ENVIADO com sucesso!",
      });
    } catch (err) {
      return res.status(500);
    }
  },

  async validateResetPasswordToken(req: Request, res: Response) {
    const { email, token } = req.query;

    try {
      if (!validateMail(email.toString())) {
        return res.status(200).json({
          status: "error",
          message: "Este EMAIL é inválido!",
        });
      }

      const user = await User.findOne({ email: email.toString() })
        .select("+passwordResetToken")
        .select("+passwordResetExpires");

      if (!user) {
        return res.status(200).json({
          status: "error",
          message: "Não foi encontrado uma conta com este EMAIL!",
        });
      }

      if (!(await bcrypt.compare(token.toString(), user.passwordResetToken))) {
        return res.status(200).json({
          status: "error",
          message: "Este TOKEN de recuperação é INVÁLIDO!",
        });
      }

      const now = new Date(Date.now());

      const expiresDate = new Date(user.passwordResetExpires);

      if (expiresDate < now) {
        return res.status(200).json({
          status: "error",
          message: "Este token EXPIROU!",
        });
      }

      return res.status(200).json({
        status: "success",
        message: "Este token está VÁLIDO!",
      });
    } catch (err) {
      return res.status(500);
    }
  },

  async resetPassword(req: Request, res: Response) {
    const { password, email, token } = req.body;

    try {
      if (!validateMail(email)) {
        return res.status(200).json({
          status: "error",
          message: "Este email é INVÁLIDO!",
        });
      }

      const user = await User.findOne({ email }).select("+passwordResetToken");

      if (!user) {
        return res.status(200).json({
          status: "error",
          message: "Não foi encontrado uma conta com este EMAIL!",
        });
      }

      if (!token) {
        return res.status(200).json({
          status: "error",
          message: "O token de alteração é NECESSÁRIO!",
        });
      }

      if (!user.passwordResetToken) {
        return res.status(200).json({
          status: "error",
          message: "Este usuário NÃO REQUISITOU a alteração de senha!",
        });
      }

      if (!(await bcrypt.compare(token, user.passwordResetToken))) {
        return res.status(200).json({
          status: "error",
          message: "Este token de alteração é INVÁLIDO!",
        });
      }

      if (password.length < 6) {
        return res.status(200).json({
          status: "error",
          message: "Essa senha é muito CURTA!",
        });
      }

      const hash = await bcrypt.hash(password, 10);

      await User.findByIdAndUpdate(user.id, {
        $set: {
          passwordVersion: user.passwordVersion + 1,
          password: hash,
        },
        $unset: {
          passwordResetToken: "",
          passwordResetExpires: "",
        },
      });

      return res.status(200).json({
        status: "success",
        message: "Senha ALTERADA com successo!",
      });
    } catch (err) {
      return res.status(500);
    }
  },
};
