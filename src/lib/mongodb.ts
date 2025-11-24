import mongoose from "mongoose";
  const MONGODB_URI = process.env.MONGODB_URI ||"mongodb://127.0.0.1:27017/nextjs_crud";
  if (!MONGODB_URI) {
  throw new Error("❌ Please add your MongoDB URI to .env.local");
  }
  let isConnected = false;
  export async function dbConnect() {
  if (isConnected) return;
try {
  await mongoose.connect(MONGODB_URI);
  isConnected = true;
  console.log("✅MongoDB connected");
  } catch (error) {
  console.error("❌ MongoDB connection error", error);
  throw error;
  }
  }