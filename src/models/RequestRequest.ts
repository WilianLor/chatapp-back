import { Schema, model, PopulatedDoc, Document } from "mongoose";

import { UserInterface } from "./User";

interface ChatRequestInterface {
  sender: PopulatedDoc<UserInterface & Document>;
  receiver: PopulatedDoc<UserInterface & Document>;
}

const ChatRequestSchema = new Schema<ChatRequestInterface>({
  sender: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

const ChatRequest = model<ChatRequestInterface>(
  "ChatRequest",
  ChatRequestSchema
);
export default ChatRequest;
