import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useGroupStore = create((set, get) => ({
    groups: [],
    selectedGroup: null,
    groupMessages: [],
    isGroupsLoading: false,
    isGroupMessagesLoading: false,
    isCreatingGroup: false,
    isUpdatingGroup: false,
    isAddingMembers: false,
    isRemovingMember: false,
    isLeavingGroup: false,
    isDeletingGroup: false,
    isSendingGroupMessage: false,

    // Get all user groups
    getUserGroups: async () => {
        set({ isGroupsLoading: true });
        try {
            const res = await axiosInstance.get("/groups");
            set({ groups: res.data });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch groups");
        } finally {
            set({ isGroupsLoading: false });
        }
    },

    // Create a new group
    createGroup: async (groupData) => {
        set({ isCreatingGroup: true });
        try {
            const formData = new FormData();
            formData.append("name", groupData.name);
            if (groupData.description) {
                formData.append("description", groupData.description);
            }
            if (groupData.groupProfile) {
                formData.append("groupProfile", groupData.groupProfile);
            }

            const res = await axiosInstance.post("/groups", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            
            const newGroup = res.data.group;
            set({ groups: [...get().groups, newGroup] });
            toast.success("Group created successfully");
            return newGroup;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create group");
            throw error;
        } finally {
            set({ isCreatingGroup: false });
        }
    },

    // Update group details
    updateGroup: async (groupId, updateData) => {
        set({ isUpdatingGroup: true });
        try {
            const formData = new FormData();
            if (updateData.name) formData.append("name", updateData.name);
            if (updateData.description !== undefined) formData.append("description", updateData.description);
            if (updateData.groupProfile) formData.append("groupProfile", updateData.groupProfile);

            const res = await axiosInstance.put(`/groups/${groupId}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            const updatedGroup = res.data.group;
            set({
                groups: get().groups.map(group => 
                    group._id === groupId ? updatedGroup : group
                ),
                selectedGroup: get().selectedGroup?._id === groupId ? updatedGroup : get().selectedGroup
            });
            toast.success("Group updated successfully");
            return updatedGroup;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update group");
            throw error;
        } finally {
            set({ isUpdatingGroup: false });
        }
    },

    // Add members to group
    addGroupMembers: async (groupId, memberIds) => {
        set({ isAddingMembers: true });
        try {
            const res = await axiosInstance.post(`/groups/${groupId}/members`, {
                members: memberIds
            });

            const updatedGroup = res.data.group;
            set({
                groups: get().groups.map(group => 
                    group._id === groupId ? updatedGroup : group
                ),
                selectedGroup: get().selectedGroup?._id === groupId ? updatedGroup : get().selectedGroup
            });
            toast.success("Members added successfully");
            return updatedGroup;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add members");
            throw error;
        } finally {
            set({ isAddingMembers: false });
        }
    },

    // Remove member from group
    removeGroupMember: async (groupId, memberId) => {
        set({ isRemovingMember: true });
        try {
            const res = await axiosInstance.delete(`/groups/${groupId}/members/${memberId}`);

            const updatedGroup = res.data.group;
            set({
                groups: get().groups.map(group => 
                    group._id === groupId ? updatedGroup : group
                ),
                selectedGroup: get().selectedGroup?._id === groupId ? updatedGroup : get().selectedGroup
            });
            toast.success("Member removed successfully");
            return updatedGroup;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to remove member");
            throw error;
        } finally {
            set({ isRemovingMember: false });
        }
    },

    // Leave group
    leaveGroup: async (groupId) => {
        set({ isLeavingGroup: true });
        try {
            await axiosInstance.delete(`/groups/${groupId}/leave`);

            set({
                groups: get().groups.filter(group => group._id !== groupId),
                selectedGroup: get().selectedGroup?._id === groupId ? null : get().selectedGroup,
                groupMessages: get().selectedGroup?._id === groupId ? [] : get().groupMessages
            });
            toast.success("Left group successfully");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to leave group");
            throw error;
        } finally {
            set({ isLeavingGroup: false });
        }
    },

    // Delete group
    deleteGroup: async (groupId) => {
        set({ isDeletingGroup: true });
        try {
            await axiosInstance.delete(`/groups/${groupId}`);

            set({
                groups: get().groups.filter(group => group._id !== groupId),
                selectedGroup: get().selectedGroup?._id === groupId ? null : get().selectedGroup,
                groupMessages: get().selectedGroup?._id === groupId ? [] : get().groupMessages
            });
            toast.success("Group deleted successfully");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete group");
            throw error;
        } finally {
            set({ isDeletingGroup: false });
        }
    },

    // Get group messages
    getGroupMessages: async (groupId) => {
        set({ isGroupMessagesLoading: true });
        try {
            const res = await axiosInstance.get(`/groups/${groupId}/messages`);
            set({ groupMessages: res.data });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch group messages");
        } finally {
            set({ isGroupMessagesLoading: false });
        }
    },

    // Send group message
    sendGroupMessage: async (groupId, messageData) => {
        set({ isSendingGroupMessage: true });
        try {
            const res = await axiosInstance.post(`/groups/${groupId}/messages`, messageData);
            const newMessage = res.data;
            set({ groupMessages: [...get().groupMessages, newMessage] });
            return newMessage;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send message");
            throw error;
        } finally {
            set({ isSendingGroupMessage: false });
        }
    },

    // Subscribe to group messages via socket
    subscribeToGroupMessages: () => {
        const { selectedGroup } = get();
        if (!selectedGroup) return;

        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.on("newGroupMessage", (newMessage) => {
            const isMessageForSelectedGroup = newMessage.groupId === selectedGroup._id;
            if (!isMessageForSelectedGroup) return;
            
            set({ groupMessages: [...get().groupMessages, newMessage] });
        });

        socket.on("groupUpdate", (data) => {
            const { group, action, groupId } = data;
            
            switch (action) {
                case "membersAdded":
                case "memberRemoved":
                case "groupUpdated":
                case "memberLeft":
                    if (group) {
                        set({
                            groups: get().groups.map(g => 
                                g._id === group._id ? group : g
                            ),
                            selectedGroup: get().selectedGroup?._id === group._id ? group : get().selectedGroup
                        });
                    }
                    break;
                case "groupDeleted":
                    set({
                        groups: get().groups.filter(g => g._id !== groupId),
                        selectedGroup: get().selectedGroup?._id === groupId ? null : get().selectedGroup,
                        groupMessages: get().selectedGroup?._id === groupId ? [] : get().groupMessages
                    });
                    break;
                default:
                    break;
            }
        });
    },

    // Unsubscribe from group messages
    unsubscribeFromGroupMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;
        
        socket.off("newGroupMessage");
        socket.off("groupUpdate");
    },

    // Set selected group
    setSelectedGroup: (group) => {
        set({ 
            selectedGroup: group,
            groupMessages: [] // Clear messages when switching groups
        });
    },

    // Clear group messages
    clearGroupMessages: () => {
        set({ groupMessages: [] });
    },

    // Clear all group data (useful for logout)
    clearGroupData: () => {
        set({
            groups: [],
            selectedGroup: null,
            groupMessages: [],
            isGroupsLoading: false,
            isGroupMessagesLoading: false,
            isCreatingGroup: false,
            isUpdatingGroup: false,
            isAddingMembers: false,
            isRemovingMember: false,
            isLeavingGroup: false,
            isDeletingGroup: false,
            isSendingGroupMessage: false,
        });
    },
}));

