import mongoose from "mongoose";

export * from "./limits";
export { setAuditContextProvider, setAuditDispatcher } from "./plugins/audit-dispatcher.js";
export * from "./schema";
export { mongoose };

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/commissionkit";

const isConnected = false;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    console.info("[DB] Connecting to MongoDB...");
    const conn = await mongoose.connect(MONGO_URL, {
      bufferCommands: true, // Allow buffering during initial connection
      autoIndex: true,
    });

    console.info(`[DB] MongoDB Connected: ${conn.connection.host}`);
    return conn.connection;
  } catch (error) {
    console.error(
      `[DB] Error connecting to MongoDB: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    throw error;
  }
};
