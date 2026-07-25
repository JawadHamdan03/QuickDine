import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import connectDb from "./config/db.js";
import authRouter from "./routes/authRoutes.js";

const app = express();

await connectDb();

// Middleware
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

app.use("/api/auth", authRouter);

app.get("/", (req: Request, res: Response) => {
    res.send("Server is Live!");
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("Unhandled error:", err);

    res.status(500).json({
        message: "Something went wrong",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});