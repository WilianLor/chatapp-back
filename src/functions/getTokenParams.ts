import jwt_decode from "jwt-decode";

interface Data {
  userId: string;
  passwordVersion: number;
}

export default (authorization: string) => {
  const tokenSplited = authorization.split(" ");

  const token = tokenSplited[1];

  const { userId, passwordVersion }: Data = jwt_decode(token);

  return { userId, passwordVersion };
};
