import mongoose from "mongoose";
import "./env"

mongoose.connect(
  `${process.env.DATABASE_URL}${process.env.DATABASE_NAME}`,
  (err) => {
    if (err) console.log(`Error: ${err}`);
    else console.log(`Connected to database ${process.env.DATABASE_NAME}`);
  }
);
