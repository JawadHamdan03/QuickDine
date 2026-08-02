import mongoose from "mongoose";
const connectDb = async () => {
    mongoose.connection.on("connected", () => console.log("MongoDB connected"));
    mongoose.connection.on("error", (err) => console.error("MongoDB connection error:", err.message));
    mongoose.connection.on("disconnected", () => console.warn("MongoDB disconnected"));
    if (!process.env.MONGODB_URI) {
        console.warn("MONGODB_URI is not set. Starting without database connection.");
        return;
    }
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 10000,
        });
    }
    catch (err) {
        console.error("MongoDB connection failed:", err instanceof Error ? err.message : err);
        console.warn("Continuing without database. Configure a reachable MongoDB URI to enable persistence.");
    }
};
export default connectDb;
