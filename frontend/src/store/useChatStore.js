import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
import { useGroupStore } from "./useGroupStore";

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    selectedChatType: null, // 'user' | 'group'
    isUsersLoading: false,
    isMessagesLoading: false,

    getUsers: async () => {
        set({isUsersLoading: true});
        try {
            const res = await axiosInstance.get("/messages/users");
            set({users: res.data});

        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({isUsersLoading: false});
        }
    },

    getMessages: async (userId) => {
        set({isMessagesLoading: true});
        try {
            const res = await axiosInstance.get(`/messages/${userId}`);
            set({messages: res.data});
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({isMessagesLoading: false});
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        try {
            const res = await axiosInstance.post(`messages/send/${selectedUser._id}`, messageData);
            if(!res) return toast.error("Error while sending message");
            set({messages: [...messages, res.data]});
        } catch (error) {
            toast.error(error.response.data.message);
        }
    },

    subscribeToMessages: () => {
        const { selectedUser } = get();
        if(!selectedUser) return;

        const socket = useAuthStore.getState().socket;

        socket.on("newMessage", (newMessage) => {
        const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;

            if(!isMessageSentFromSelectedUser) return;
            set({messages: [...get().messages, newMessage]});
        })
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket.off("newMessage");
    },

    setSelectedUser: async (selectedUser) => {
        set({
            selectedUser,
            selectedChatType: 'user',
            messages: []
        });
        // Clear group messages and selected group in groupStore
    const groupStore = useGroupStore.getState();
    groupStore.clearGroupMessages();
    groupStore.setSelectedGroup(null); // <-- Add this line
    },

    // Clear selected chat
    clearSelectedChat: () => {
        set({
            selectedUser: null,
            selectedChatType: null,
            messages: []
        });
    },

    // Set chat type (for future use when switching between user and group chats)
    setSelectedChatType: (chatType) => {
        set({ selectedChatType: chatType });
    },
}))