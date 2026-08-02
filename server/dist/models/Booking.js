import { Schema, model } from "mongoose";
import crypto from "crypto";
const BookingSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true, trim: true },
    guests: { type: Number, required: true, min: 1, default: 1 },
    occasion: { type: String, trim: true, default: "" },
    specialRequests: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["confirmed", "cancelled", "completed"], default: "confirmed" },
    bookingId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        default: () => `GR-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
    },
}, { timestamps: true });
export const Booking = model("Booking", BookingSchema);
