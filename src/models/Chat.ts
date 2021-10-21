import { Schema, model, PopulatedDoc, Document } from "mongoose";

import { UserInterface } from "./User";
import { MessageInterface } from "./Message";

export interface ChatInterface {
  users: PopulatedDoc<UserInterface & Document>[];
  messages: PopulatedDoc<MessageInterface & Document>[];
}

const ChatSchema = new Schema<ChatInterface>({
  users: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  messages: [
    {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
  ],
});

const Chat = model<ChatInterface>("Chat", ChatSchema);
export default Chat;
