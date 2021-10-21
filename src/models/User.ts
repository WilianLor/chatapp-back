import { Schema, model, PopulatedDoc, Document } from "mongoose";
import bcrypt from "bcryptjs";

import { ChatInterface } from "./Chat";

export interface UserInterface {
  name: string;
  email: string;
  password?: string;
  passwordResetToken?: string;
  passwordResetExpires?: string;
  passwordVersion: number;
  chats?: PopulatedDoc<ChatInterface & Document>[];
}

const UserSchema = new Schema<UserInterface>({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: String,
    select: false,
  },
  passwordVersion: {
    type: Number,
    default: 1,
  },
  chats: [
    {
      type: Schema.Types.ObjectId,
      ref: "Chat",
    },
  ],
});

UserSchema.pre("save", async function <type>(next) {
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;

  next();
});

const User = model<UserInterface>("User", UserSchema);
export default User;
