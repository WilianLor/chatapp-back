import { httpServer } from "./app";

import "./services/webSocket";
import "./services/env";
import "./services/mongodb";

httpServer.listen(process.env.PORT, () =>
  console.log("API is running at PORT " + process.env.PORT)
);
