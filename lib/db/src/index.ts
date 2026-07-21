import mongoose from "mongoose";
export { mongoose };

export * from "./schema";
export * from "./limits";
export { setAuditDispatcher, setAuditContextProvider } from "./plugins/audit-dispatcher.js";

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/commissionkit";

let isConnected = false;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    console.log("[DB] Connecting to MongoDB...");
    const conn = await mongoose.connect(MONGO_URL, {
      bufferCommands: true, // Allow buffering during initial connection
      autoIndex: true,
    });
    
    console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);
    return conn.connection;
  } catch (error) {
    console.error(`[DB] Error connecting to MongoDB: ${error instanceof Error ? error.message : "Unknown error"}`);
    throw error;
  }
};
