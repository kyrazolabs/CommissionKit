import mongoose from "mongoose";

export * from "./schema";
export * from "./limits";

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/commissionkit";

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(MONGO_URL, {
      bufferCommands: false,
    });
    
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error instanceof Error ? error.message : "Unknown error"}`);
    throw error;
  }
};
