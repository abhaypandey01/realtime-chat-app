import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";


export const getUserForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
    
        const users = await User.find({_id: {$ne: loggedInUserId}}).select("-password");
    
        res.status(200).json(users);
    } catch (error) {
        console.log("Error in get users for sidebar:", error.message);
        res.status(500).json({message: "Internal server error."});
    }
}

export const getMessages = async (req, res) => {
    try {
        const { id:userToChatId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                {receiverId:userToChatId, senderId:myId},
                {receiverId: myId, senderId:userToChatId},
            ]
        });

        res.status(200).json(messages
        )

    } catch (error) {
        console.log("Error in get messages:", error.message);
        res.status(500).json({message: "Internal server error."});
    }
}

export const sendMessage = async (req, res) => {
    try {
        const {text, image} = req.body;
        const {id:receiverId} = req.params;

        if(!receiverId){
            return res.status(401).json({message: "Reciever id not found"})
        }
    
        const senderId = req.user?._id;
        let imageUrl;
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }
    
        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl
        })
    
        newMessage.save();
    
        //todo: realtime message functionalitty using socket.io.
        const receiverSocketId = getReceiverSocketId(receiverId);
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in send message controler: ", error.message);
        res.status(500).json({message: "Internal server error"})
    }
}