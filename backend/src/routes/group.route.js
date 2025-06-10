import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
    createGroup,
    getUserGroups,
    addGroupMembers,
    removeGroupMember,
    sendGroupMessage,
    getGroupMessages,
    updateGroup,
    leaveGroup,
    deleteGroup
} from "../controllers/group.controller.js";

const router = Router();

// Create and get groups
import { uploadGroupProfile, handleMulterError } from "../middleware/upload.middleware.js";
router.post("/", protectRoute, uploadGroupProfile, handleMulterError, createGroup);
router.get("/", protectRoute, getUserGroups);

// Group management
router.post("/:groupId/members", protectRoute, addGroupMembers);
router.delete("/:groupId/members/:memberId", protectRoute, removeGroupMember);
router.put("/:groupId", protectRoute, uploadGroupProfile, handleMulterError, updateGroup);
router.delete("/:groupId/leave", protectRoute, leaveGroup);
router.delete("/:groupId", protectRoute, deleteGroup);

// Group messages
router.post("/:groupId/messages", protectRoute, sendGroupMessage);
router.get("/:groupId/messages", protectRoute, getGroupMessages);

export default router;

