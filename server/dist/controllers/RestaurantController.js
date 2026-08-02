import jwt from "jsonwebtoken";
import { Restaurant } from "../models/Restaurant.js";
import { User } from "../models/User.js";
import { Booking } from "../models/Booking.js";
const getCurrentUserFromToken = async (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
        return null;
    try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return await User.findById(decoded.id);
    }
    catch {
        return null;
    }
};
const canAccessRestaurant = (user, restaurant) => {
    if (!user)
        return false;
    if (user.role === "admin")
        return true;
    return user.role === "owner" && restaurant.owner.toString() === user._id.toString();
};
// GET /api/restaurant
export const getRestaurants = async (req, res) => {
    try {
        const { search, priceRange, rating, location, sort } = req.query;
        const queryObj = { status: "approved" };
        if (typeof search === "string" && search.trim()) {
            const term = search.trim();
            queryObj.$or = [
                { name: { $regex: term, $options: "i" } },
                { tags: { $regex: term, $options: "i" } },
                { location: { $regex: term, $options: "i" } },
            ];
        }
        if (priceRange) {
            const prices = Array.isArray(priceRange) ? priceRange : [priceRange];
            const validPrices = prices.filter((item) => typeof item === "string" && item.trim().length > 0);
            if (validPrices.length > 0) {
                queryObj.priceRange = { $in: validPrices };
            }
        }
        if (typeof rating === "string" && rating.trim()) {
            queryObj.rating = { $gte: Number(rating) };
        }
        if (typeof location === "string" && location.trim()) {
            queryObj.location = { $regex: location.trim(), $options: "i" };
        }
        let sortOption = { createdAt: -1 };
        if (sort === "rating") {
            sortOption = { rating: -1, createdAt: -1 };
        }
        else if (sort === "price_low") {
            sortOption = { priceRange: 1, createdAt: -1 };
        }
        else if (sort === "price_high") {
            sortOption = { priceRange: -1, createdAt: -1 };
        }
        const restaurants = await Restaurant.find(queryObj).sort(sortOption);
        res.status(200).json(restaurants);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch restaurants", error: error instanceof Error ? error.message : error });
    }
};
// GET /api/restaurant/featured
export const getFeaturedRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.find({ featured: true, status: "approved" })
            .limit(8);
        res.status(200).json(restaurants);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch featured restaurants", error: error instanceof Error ? error.message : error });
    }
};
// GET /api/restaurant/:slug
export const getRestaurantBySlug = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ slug: req.params.slug });
        if (!restaurant) {
            res.status(404).json({ message: "Restaurant not found" });
            return;
        }
        if (restaurant.status !== "approved") {
            let isAuthorized = false;
            if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
                try {
                    const token = req.headers.authorization.split(" ")[1];
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    const user = await User.findById(decoded.id);
                    if (user && (user.role === "admin" || (user.role === "owner") && restaurant.owner.toString() === user?._id.toString())) {
                        isAuthorized = true;
                    }
                }
                catch (error) {
                }
                if (!isAuthorized) {
                    res.status(404).json({ message: "Restaurant not found or pending approval" });
                }
            }
        }
        res.status(200).json(restaurant);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch restaurant", error: error instanceof Error ? error.message : error });
    }
};
// GET /api/restaurant/:id/availability
export const getRestaurantAvailability = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            res.status(404).json({ message: "please provide a date" });
            return;
        }
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            res.status(404).json({ message: "restaurant not found" });
        }
        const bookingDate = new Date(date);
        const bookings = await Booking.find({
            restaurant: restaurant?._id,
            date: bookingDate,
            status: "confirmed"
        });
        const availability = restaurant?.availableSlots.map((slot) => {
            const bookedSeats = bookings.filter(b => b.time === slot).reduce((sum, b) => sum + b.guests, 0);
            const totalSeats = restaurant.totalSeats || 20;
            const availableSeats = Math.max(0, totalSeats - bookedSeats);
            return {
                time: slot,
                availableSeats,
                isAvailable: availableSeats > 0
            };
        });
        res.status(200).json(availability);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch availability", error: error instanceof Error ? error.message : error });
    }
};
// POST /api/restaurant
export const createRestaurant = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Not authenticated" });
            return;
        }
        const restaurant = await Restaurant.create({
            ...req.body,
            owner: req.user._id,
        });
        res.status(201).json(restaurant);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to create restaurant", error: error instanceof Error ? error.message : error });
    }
};
// PUT /api/restaurant/:id
export const updateRestaurant = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Not authenticated" });
            return;
        }
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            res.status(404).json({ message: "Restaurant not found" });
            return;
        }
        if (!canAccessRestaurant(req.user, restaurant)) {
            res.status(403).json({ message: "You are not allowed to update this restaurant" });
            return;
        }
        const updatedRestaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.status(200).json(updatedRestaurant);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to update restaurant", error: error instanceof Error ? error.message : error });
    }
};
// DELETE /api/restaurant/:id
export const deleteRestaurant = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Not authenticated" });
            return;
        }
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            res.status(404).json({ message: "Restaurant not found" });
            return;
        }
        if (!canAccessRestaurant(req.user, restaurant)) {
            res.status(403).json({ message: "You are not allowed to delete this restaurant" });
            return;
        }
        await Restaurant.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Restaurant deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to delete restaurant", error: error instanceof Error ? error.message : error });
    }
};
