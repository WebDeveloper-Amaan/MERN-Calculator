import mongoose from "mongoose";

let mongoConnected = false;

export function isMongoConnected() {
  return mongoConnected && mongoose.connection.readyState === 1;
}

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    mongoConnected = false;
    console.warn("[mongo] MONGODB_URI is not set. Using local fallback storage.");
    return false;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    mongoConnected = true;
    console.log("[mongo] connected");
    return true;
  } catch (error) {
    mongoConnected = false;
    console.warn("[mongo] connection failed, using local fallback storage.");
    console.warn(error.message);
    return false;
  }
}