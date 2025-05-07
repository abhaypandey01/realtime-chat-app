import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const signup = async (req,res)=>{
    const {fullName, email, password} = req.body;
    try {

        if( !fullName ||
            !email ||
            !password){
            return res.status(400)
            .json({
                message: "All fields are required."
            })
        }

        if(password.length < 6){
            return res.status(400)
            .json({
                message: "Password length must be at least 6 characters."
            });
        }

        const user = await User.findOne({email});
        if(user){
            return res.status(400)
            .json({
                message: "User with this email already registered."
            })
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            fullName,
            email,
            password: hashedPassword,
        });

        if(!newUser){
            return res.status(401)
            .json({ 
                message: "User not created incomplete details." 
            });
        }

        generateToken(newUser._id, res);
        await newUser.save();

        res.status(201)
        .json({
            _id: newUser._id,
            fullName: newUser.fullName,
            email: newUser.email,
            profilePic: newUser.profilePic,
            message: "New user Created Successfully."
        })
    } catch (error) {
        console.log("Error in signup controller: ", error.message);
    }
}

export const login = async (req,res)=>{
    const { email, password } = req.body;
    try {
        if(!email || !password){
            return res.status(400)
            .json({
                message:"Both fields are required"
            })
        }

        const user = await User.findOne({email});

        if(!user){
            return res.status(400)
            .json({
                message:"Invalid Credentials"
            })
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if(!isPasswordCorrect){
            return res.status(400)
            .json({
                message:"Invalid Credentials"
            })
        }

        generateToken(user._id, res);

        res.status(200)
        .json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
            message: "User logged in Successfully."
        })
    } catch (error) {
        console.log("Error in log in controller: ", error.message);
        res.status(500)
        .json({
            message:"Internal server error."
        })
    }
}

export const logout = (req,res)=>{
    try {
        res.cookie("jwt", "", {maxAge:0});
        res.status(200)
        .json({ message: "Logout successfull" });
    } catch (error) {
        console.log("Error in log out controller: ", error.message);
        res.status(500)
        .json({
            message:"Internal server error."
        })
    }
}

export const updateProfile = async (req, res) => {
    try {
        const {profilePic} = req.body;
        const userId = req.user._id;

        if(!profilePic){
            req.status(400).json({
                message: "profile pic missing."
            })
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePic);

        const updatedUser = await User.findByIdAndUpdate(userId, {
            profilePic: uploadResponse.secure_url,
        }, {new: true}).select("-password");

        res.status(200).json(
            updatedUser,
        {
            message: "ProfilePic Upadated successfully."
        })
    } catch (error) {
        console.log("Error in update profile controller: ", error.message);
        res.status(500).json({message: "Error occured while updating the user profile pic"})
    }
}

export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user, {message: "Authenticated user found."});
    } catch (error) {
        console.log("Error in checkAuth controller: ", error.message);
        res.status(500).json({message: "Internal Servar Error"})
    }
}