import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
try {
    const token = req.cookies.jwt;

    if(!token){
        res.status(401).json({message: "Unauthorized - No token provided."});
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if(!decoded){
        res.status(401).json({message: "Unauthorized - Invalid token."});
    }

    const user = await User.findById(decoded.userId).select("-password");

    if(!user){
        res.status(404).json({message: "User not found"});
    }

    req.user = user;

    next();
} catch (error) {
    console.log("Error in auth middleware: ", error.message);
    res.status(501).json({message: "Error ocurred in auth middleware"})
}
}