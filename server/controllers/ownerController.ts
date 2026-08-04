import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";
import { IRestaurant, Restaurant } from "../models/Restaurant.js";
import { Booking } from "../models/Booking.js";
import { v2 as cloudinary } from "cloudinary";


const uploadToCloudinary =  (fileBuffer: Buffer) : Promise<{secure_url:string}>=>{
    return new Promise((resolve,reject)=>{
        const stream = cloudinary.uploader.upload_stream({folder:"QuickDine"},(error,result)=>{
            if (error) return reject(error)
            if (!result) return reject(new Error("upload failed"))
            resolve({secure_url:result.secure_url});
            })
            stream.end(fileBuffer);
    })
}


// GET /api/owner/restaurant
export const getOwnerRestaurant = async (req: AuthRequest, res: Response) => {
    try {
        const restaurants = await Restaurant.find({ owner: req.user?._id });
        if (!restaurants){
         res.status(400).json({message:"no restaurants were found for this user"})   
         return;
        }
        res.json(restaurants);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/owner/restaurant
export const createOwnerRestaurant = async (req: AuthRequest, res: Response) => {
    try {

        const {name,description,cuisine,priceRange, location,
            address,chef,tags,availableSlots,totalSeats}= req.body

        const existing = await Restaurant.find({ owner: req.user?._id });
        if (existing.length > 0) {
            res.status(400).json({message:"you already have a restaurant"})
            return;
        }

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)+/g,"")

        const slugExists = await Restaurant.findOne({slug})

        if (slugExists) {
            res.status(400).json({message:"slug already exists"})
            return;
        }

        let imageUrl= ""
        if (req.file) {
            const result = uploadToCloudinary(req.file.buffer);
            imageUrl=(await result).secure_url
        }


        const parsedTags = typeof tags ==="string" ? tags.split(",").map(t=>t.trim()):tags||[]; 

        const parsedSlots = typeof availableSlots ==="string" ? availableSlots.split(",")
        .map(t=>t.trim()):availableSlots||["17:00","18:00","19:00","20:00","21:00"]; 

        const restaurant = await Restaurant.create({name,slug,description,cuisine,priceRange,
            location,address,chef,image:imageUrl,tags:parsedTags,availableSlots:parsedSlots,
            totalSeats:totalSeats? totalSeats :20,
            owner: req.user?._id,
            status:"pending" 
        });
        res.status(201).json(restaurant);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// PUT /api/owner/restaurant
export const updateOwnerRestaurant = async (req: AuthRequest, res: Response) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user?._id });
        if (!restaurant) {
            res.status(404).json({ message: "Restaurant not found." });
            return;
        }

        const {name,description,cuisine,priceRange, location,
            address,chef,tags,availableSlots,totalSeats}= req.body

        if(name) restaurant.name=name
        if(description) restaurant.description=description;
        if(cuisine) restaurant.cuisine = cuisine
        if(priceRange) restaurant.priceRange=priceRange
        if(location) restaurant.location=location
        if (address) restaurant.address=address
        if (chef) restaurant.chef=chef
        if (totalSeats) restaurant.totalSeats=totalSeats
        
        if(tags) restaurant.tags= typeof tags ==="string" ? tags.split(",").map(t=>t.trim()):tags||[]
        if (availableSlots) restaurant.availableSlots =  typeof availableSlots ==="string" ? availableSlots.split(",")
        .map(t=>t.trim()):availableSlots||["17:00","18:00","19:00","20:00","21:00"];

        
        if (req.file) {
            const result = uploadToCloudinary(req.file.buffer);
            restaurant.image=(await result).secure_url
        }


        if (restaurant.owner.toString() !== req.user?._id.toString()) {
            res.status(403).json({ message: "Not authorized to update this restaurant." });
            return;
        }

        const updated = await restaurant.save();

       
        res.json(updated);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// GET /api/owner/bookings
export const getOwnerBookings = async (req: AuthRequest, res: Response) => {
    try {
        const restaurants = await Restaurant.find({ owner: req.user?._id });
        const restaurantIds = restaurants.map((restaurant) => restaurant._id);

        if (!restaurants.length) {
            res.status(400).json({ message: "restaurants profile not found" });
            return;
        }

        const bookings = await Booking.find({ restaurant: { $in: restaurantIds } })
            .populate("restaurant", "name location address slug")
            .populate("user", "name email")
            .sort({ date: -1, time: -1 });

        res.json(bookings);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/owner/bookings/:id/status
export const updateOwnerBookingsStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.body;
        const validStatuses = ["confirmed", "cancelled", "completed"];
        if (!status || !validStatuses.includes(status)) {
            res.status(400).json({ message: `Status must be one of: ${validStatuses.join(", ")}.` });
            return;
        }

        const booking = await Booking.findById(req.params.id).populate("restaurant");
        if (!booking) {
            res.status(404).json({ message: "Booking not found." });
            return;
        }

        const restaurant = await Restaurant.findById(booking.restaurant);
        if (!restaurant || restaurant.owner.toString() !== req.user?._id.toString()) {
            res.status(403).json({ message: "Not authorized to update this booking." });
            return;
        }

        booking.status = status;
        await booking.save();
        res.json(booking);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
