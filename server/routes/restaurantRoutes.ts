import { Router } from "express";
import {
    createRestaurant,
    deleteRestaurant,
    getFeaturedRestaurants,
    getRestaurantAvailability,
    getRestaurantBySlug,
    getRestaurants,
    updateRestaurant,
} from "../controllers/RestaurantController.js";
import { protect } from "../middlewares/auth.js";

const restaurantRouter = Router();

restaurantRouter.get("/", getRestaurants);
restaurantRouter.get("/featured", getFeaturedRestaurants);
restaurantRouter.get("/:id/availability", getRestaurantAvailability);
restaurantRouter.get("/:slug", getRestaurantBySlug);

restaurantRouter.post("/", protect, createRestaurant);
restaurantRouter.put("/:id", protect, updateRestaurant);
restaurantRouter.delete("/:id", protect, deleteRestaurant);

export default restaurantRouter;
