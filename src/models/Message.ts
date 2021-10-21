import { Schema, model, PopulatedDoc, Document } from "mongoose";

import { UserInterface } from "./User";
import { ChatInterface } from "./Chat";

export interface MessageInterface {
  date: Date;
  content: string;
  readed: boolean;
  author: PopulatedDoc<UserInterface & Document>;
  chatId: PopulatedDoc<ChatInterface & Document>;
}

const MessageSchema = new Schema<MessageInterface>({
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  chatId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Chat",
  },
  date: {
    type: Date,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  readed: {
    type: Boolean,
    default: false,
  },
});

const Message = model<MessageInterface>("Message", MessageSchema);
export default Message;
