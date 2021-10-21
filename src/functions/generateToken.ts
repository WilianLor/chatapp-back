import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({
  path: ".env",
});

export default (params = {}) => {
  return jwt.sign(params, process.env.SECRET, {
    expiresIn: 86400,
  });
};
