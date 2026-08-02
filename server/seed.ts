import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { User } from "./models/User.js";
import { Restaurant } from "./models/Restaurant.js";
import { Booking } from "./models/Booking.js";

const MONGO_URL = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/quickdine";

const seedData = async () => {
  try {
    console.log("Connecting to Database for seeding...");
    await mongoose.connect(MONGO_URL);
    console.log(`Database connected to ${MONGO_URL}`);

    console.log("Clearing existing collections...");
    await Promise.all([
      User.deleteMany({}),
      Restaurant.deleteMany({}),
      Booking.deleteMany({}),
    ]);

    console.log("Creating default users...");
    const salt = await bcrypt.genSalt(10);
    const hashedPasswords = {
      admin: await bcrypt.hash("admin123", salt),
      user: await bcrypt.hash("user123", salt),
      owner: await bcrypt.hash("owner123", salt),
    };

    const [adminUser, regularUser, ownerUser] = await User.create([
      {
        name: "Admin User",
        email: "admin@quickdine.com",
        password: hashedPasswords.admin,
        role: "admin",
      },
      {
        name: "Jordan Lee",
        email: "jordan@quickdine.com",
        password: hashedPasswords.user,
        role: "user",
      },
      {
        name: "Maya Patel",
        email: "maya@quickdine.com",
        password: hashedPasswords.owner,
        role: "owner",
      },
    ]);

    console.log("Creating sample restaurants...");
    const restaurants = await Restaurant.create([
      {
        name: "Saffron Street",
        slug: "saffron-street",
        description: "A lively Indian bistro serving modern comfort classics and late-night brunch.",
        cuisine: "Indian",
        priceRange: "$$",
        rating: 4.8,
        reviewCount: 128,
        location: "Downtown",
        address: "12 Market Street, Downtown",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
        chef: "Asha Rao",
        tags: ["Spicy", "Live music", "Late-night"],
        availableSlots: ["18:00", "19:00", "20:30"],
        featured: true,
        exclusive: false,
        owner: ownerUser._id,
        status: "approved",
        totalSeats: 40,
      },
      {
        name: "Harbor & Hearth",
        slug: "harbor-hearth",
        description: "Seafood-forward dining with a waterfront view and chef's tasting menu.",
        cuisine: "Seafood",
        priceRange: "$$$",
        rating: 4.6,
        reviewCount: 87,
        location: "Waterfront",
        address: "45 Pier Avenue, Waterfront",
        image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80",
        chef: "Leo Chen",
        tags: ["Ocean view", "Chef's tasting", "Romantic"],
        availableSlots: ["17:30", "19:30", "20:15"],
        featured: true,
        exclusive: true,
        owner: ownerUser._id,
        status: "approved",
        totalSeats: 28,
      },
      {
        name: "The Green Table",
        slug: "the-green-table",
        description: "A cozy vegetarian cafe focused on seasonal produce and handcrafted desserts.",
        cuisine: "Vegetarian",
        priceRange: "$",
        rating: 4.2,
        reviewCount: 54,
        location: "Midtown",
        address: "88 Willow Lane, Midtown",
        image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80",
        chef: "Nina Alvarez",
        tags: ["Vegetarian", "Cozy", "Brunch"],
        availableSlots: ["12:30", "18:30"],
        featured: false,
        exclusive: false,
        owner: ownerUser._id,
        status: "pending",
        totalSeats: 24,
      },
      {
        name: "Cedar & Oak",
        slug: "cedar-and-oak",
        description: "Rustic steakhouse with smoked specialties and a polished late dinner experience.",
        cuisine: "Steakhouse",
        priceRange: "$$$",
        rating: 4.4,
        reviewCount: 61,
        location: "Old Town",
        address: "220 Cedar Avenue, Old Town",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
        chef: "Darius Brooks",
        tags: ["Steak", "Private dining", "Wine pairings"],
        availableSlots: ["18:45", "20:00"],
        featured: false,
        exclusive: false,
        owner: ownerUser._id,
        status: "rejected",
        totalSeats: 32,
      },
    ]);

    console.log("Creating sample bookings...");
    await Booking.create([
      {
        user: regularUser._id,
        restaurant: restaurants[0]._id,
        date: new Date("2026-08-15T19:00:00.000Z"),
        time: "19:00",
        guests: 2,
        occasion: "Anniversary",
        specialRequests: "Window seat if available",
        status: "confirmed",
        bookingId: "GR-BOOKING-001",
      },
      {
        user: regularUser._id,
        restaurant: restaurants[1]._id,
        date: new Date("2026-08-18T20:00:00.000Z"),
        time: "20:00",
        guests: 4,
        occasion: "Birthday",
        specialRequests: "Vegetarian options for one guest",
        status: "completed",
        bookingId: "GR-BOOKING-002",
      },
      {
        user: regularUser._id,
        restaurant: restaurants[2]._id,
        date: new Date("2026-08-20T18:30:00.000Z"),
        time: "18:30",
        guests: 3,
        occasion: "Casual dinner",
        specialRequests: "",
        status: "confirmed",
        bookingId: "GR-BOOKING-003",
      },
    ]);

    console.log(
      `Seed complete. Created ${3} users, ${restaurants.length} restaurants, and 3 bookings.`
    );
  } catch (error: any) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database");
  }
};

seedData();