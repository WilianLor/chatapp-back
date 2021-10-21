import { Router } from "express";

import userController from "./controllers/userController";
import chatController from "./controllers/chatController";

import auth from "./middlewares/auth";

const routes = Router();

routes.post("/user/create", userController.create);
routes.post("/user/login", userController.login);
routes.get("/user/data", auth, userController.getData);

routes.post("/forgotpassword", userController.sendResetPasswordToken);
routes.get("/validatetoken", userController.validateResetPasswordToken);
routes.put("/resetpassword", userController.resetPassword);

routes.get("/users", auth, userController.getWithFilter);

routes.get("/user/chat/getall", auth, chatController.getAllChats);

routes.post("/user/request/send", auth, chatController.sendChatRequest);
routes.put("/user/request/action", auth, chatController.actionChatRequest);
routes.get("/user/request/getall", auth, chatController.getChatRequests);

routes.put("/user/chat/delete", auth, chatController.removeChat);

export default routes;
