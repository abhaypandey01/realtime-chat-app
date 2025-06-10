import Group from "../models/group.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// Create a new group
export const createGroup = async (req, res) => {
    try {
        // Get text fields from request body
        const { name, description } = req.body;
        const userId = req.user._id;

        if (!name) {
            return res.status(400).json({
                message: "Group name is required."
            });
        }

        let groupProfileUrl = "";
        // Check if file was uploaded
        if (req.file) {
            try {
                // Convert buffer to base64 string for cloudinary
                const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
                const uploadResponse = await cloudinary.uploader.upload(fileStr);
                groupProfileUrl = uploadResponse.secure_url;
            } catch (err) {
                console.log("Error uploading to Cloudinary:", err);
                return res.status(400).json({ message: "Error uploading group profile image." });
            }
        }

        const newGroup = await Group.create({
            name,
            description: description || "",
            admin: userId,
            members: [userId],
            groupProfile: groupProfileUrl
        });

        await newGroup.save();

        // Populate admin and members information for response
        const populatedGroup = await Group.findById(newGroup._id)
            .populate("admin", "fullName email profilePic")
            .populate("members", "fullName email profilePic");

        res.status(201).json({
            group: populatedGroup,
            message: "Group created successfully."
        });
    } catch (error) {
        console.log("Error in createGroup controller: ", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Get all groups for a user
export const getUserGroups = async (req, res) => {
    try {
        const userId = req.user._id;

        const groups = await Group.find({
            members: { $in: [userId] }
        })
            .populate("admin", "fullName email profilePic")
            .populate("members", "fullName email profilePic");

        res.status(200).json(groups);
    } catch (error) {
        console.log("Error in getUserGroups controller: ", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Add members to a group
export const addGroupMembers = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { members } = req.body; // Array of user IDs
        const userId = req.user._id;

        if (!members || !Array.isArray(members) || members.length === 0) {
            return res.status(400).json({
                message: "Please provide valid member IDs."
            });
        }

        // Check if group exists
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                message: "Group not found."
            });
        }

        // Check if user is admin
        if (group.admin.toString() !== userId.toString()) {
            return res.status(403).json({
                message: "Only group admin can add members."
            });
        }

        // Filter out users that already exist in the group
        const newMembers = members.filter(memberId => 
            !group.members.includes(memberId)
        );

        // Add new members to the group
        if (newMembers.length > 0) {
            group.members.push(...newMembers);
            await group.save();
        }

        // Get updated group with populated fields
        const updatedGroup = await Group.findById(groupId)
            .populate("admin", "fullName email profilePic")
            .populate("members", "fullName email profilePic");

        // Notify all existing members about new members
        group.members.forEach(memberId => {
            const memberSocketId = getReceiverSocketId(memberId.toString());
            if (memberSocketId) {
                io.to(memberSocketId).emit("groupUpdate", {
                    group: updatedGroup,
                    action: "membersAdded"
                });
            }
        });

        res.status(200).json({
            group: updatedGroup,
            message: "Members added successfully."
        });
    } catch (error) {
        console.log("Error in addGroupMembers controller: ", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Remove a member from a group
export const removeGroupMember = async (req, res) => {
    try {
        const { groupId, memberId } = req.params;
        const userId = req.user._id;

        // Check if group exists
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                message: "Group not found."
            });
        }

        // Check permissions: admin can remove anyone, member can only remove themselves
        const isAdmin = group.admin.toString() === userId.toString();
        const isSelfRemoval = memberId === userId.toString();

        if (!isAdmin && !isSelfRemoval) {
            return res.status(403).json({
                message: "You don't have permission to remove this member."
            });
        }

        // Check if member exists in the group
        if (!group.members.includes(memberId)) {
            return res.status(400).json({
                message: "User is not a member of this group."
            });
        }

        // Remove member
        group.members = group.members.filter(id => id.toString() !== memberId);
        await group.save();

        // Get updated group with populated fields
        const updatedGroup = await Group.findById(groupId)
            .populate("admin", "fullName email profilePic")
            .populate("members", "fullName email profilePic");

        // Notify all existing members about member removal
        group.members.forEach(memberId => {
            const memberSocketId = getReceiverSocketId(memberId.toString());
            if (memberSocketId) {
                io.to(memberSocketId).emit("groupUpdate", {
                    group: updatedGroup,
                    action: "memberRemoved"
                });
            }
        });

        res.status(200).json({
            group: updatedGroup,
            message: "Member removed successfully."
        });
    } catch (error) {
        console.log("Error in removeGroupMember controller: ", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Send a message to a group
export const sendGroupMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const { groupId } = req.params;
        const senderId = req.user._id;

        // Check if group exists
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                message: "Group not found."
            });
        }

        // Check if sender is a group member
        if (!group.members.includes(senderId)) {
            return res.status(403).json({
                message: "You are not a member of this group."
            });
        }

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            groupId,
            text,
            image: imageUrl
        });

        await newMessage.save();

        // Populate sender details for response
        const populatedMessage = await Message.findById(newMessage._id).populate("senderId", "fullName profilePic");

        // Send real-time message to all group members via socket.io
        group.members.forEach(memberId => {
            if (memberId.toString() !== senderId.toString()) {
                const memberSocketId = getReceiverSocketId(memberId.toString());
                if (memberSocketId) {
                    io.to(memberSocketId).emit("newGroupMessage", populatedMessage);
                }
            }
        });

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.log("Error in sendGroupMessage controller: ", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Get all messages for a group
export const getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user._id;

        // Check if group exists
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                message: "Group not found."
            });
        }

        // Check if user is a group member
        if (!group.members.includes(userId)) {
            return res.status(403).json({
                message: "You are not a member of this group."
            });
        }

        const messages = await Message.find({ groupId })
            .populate("senderId", "fullName profilePic")
            .sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getGroupMessages controller: ", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Update group details
export const updateGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { name, description } = req.body;
        const userId = req.user._id;

        // Check if group exists
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                message: "Group not found."
            });
        }

        // Check if user is admin
        if (group.admin.toString() !== userId.toString()) {
            return res.status(403).json({
                message: "Only group admin can update group details."
            });
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;

        // Check if file was uploaded for group profile picture
        if (req.file) {
            try {
                // Convert buffer to base64 string for cloudinary
                const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
                const uploadResponse = await cloudinary.uploader.upload(fileStr);
                updateData.groupProfile = uploadResponse.secure_url;
            } catch (err) {
                console.log("Error uploading to Cloudinary:", err);
                return res.status(400).json({ message: "Error uploading group profile image." });
            }
        }

        // Only proceed with update if there are fields to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                message: "No update data provided."
            });
        }

        const updatedGroup = await Group.findByIdAndUpdate(
            groupId,
            updateData,
            { new: true }
        )
            .populate("admin", "fullName email profilePic")
            .populate("members", "fullName email profilePic");

        // Notify all group members about the update
        group.members.forEach(memberId => {
            const memberSocketId = getReceiverSocketId(memberId.toString());
            if (memberSocketId) {
                io.to(memberSocketId).emit("groupUpdate", {
                    group: updatedGroup,
                    action: "groupUpdated"
                });
            }
        });

        res.status(200).json({
            group: updatedGroup,
            message: "Group updated successfully."
        });
    } catch (error) {
        console.log("Error in updateGroup controller: ", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Leave group
export const leaveGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user._id;

        // Check if group exists
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                message: "Group not found."
            });
        }

        // Check if user is a member
        if (!group.members.includes(userId)) {
            return res.status(400).json({
                message: "You are not a member of this group."
            });
        }

        // If user is admin and there are other members, assign admin role to the oldest member
        if (group.admin.toString() === userId.toString() && group.members.length > 1) {
            // Find the oldest member who is not the current admin
            const oldestMember = group.members.find(memberId => 
                memberId.toString() !== userId.toString()
            );
            
            if (oldestMember) {
                group.admin = oldestMember;
            }
        }

        // Remove user from members
        group.members = group.members.filter(id => id.toString() !== userId.toString());

        // If no members left, delete the group
        if (group.members.length === 0) {
            await Group.findByIdAndDelete(groupId);
            
            // Optionally, delete all messages associated with this group
            await Message.deleteMany({ groupId });
            
            return res.status(200).json({
                message: "You left the group and it was deleted as no members remain."
            });
        }

        await group.save();

        // Get updated group with populated fields
        const updatedGroup = await Group.findById(groupId)
            .populate("admin", "fullName email profilePic")
            .populate("members", "fullName email profilePic");

        // Notify all remaining members
        group.members.forEach(memberId => {
            const memberSocketId = getReceiverSocketId(memberId.toString());
            if (memberSocketId) {
                io.to(memberSocketId).emit("groupUpdate", {
                    group: updatedGroup,
                    action: "memberLeft",
                    userId: userId.toString()
                });
            }
        });

        res.status(200).json({
            message: "You left the group successfully."
        });
    } catch (error) {
        console.log("Error in leaveGroup controller: ", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Delete group
export const deleteGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user._id;

        // Check if group exists
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                message: "Group not found."
            });
        }

        // Check if user is admin
        if (group.admin.toString() !== userId.toString()) {
            return res.status(403).json({
                message: "Only group admin can delete the group."
            });
        }

        // Get members before deletion for notification
        const members = [...group.members];

        // Delete group and all related messages
        await Group.findByIdAndDelete(groupId);
        await Message.deleteMany({ groupId });

        // Notify all members about group deletion
        members.forEach(memberId => {
            const memberSocketId = getReceiverSocketId(memberId.toString());
            if (memberSocketId) {
                io.to(memberSocketId).emit("groupUpdate", {
                    groupId,
                    action: "groupDeleted"
                });
            }
        });

        res.status(200).json({
            message: "Group deleted successfully."
        });
    } catch (error) {
        console.log("Error in deleteGroup controller: ", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};


