import { X, Settings, Users, Crown } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import GroupManagementModal from "./GroupManagementModal";

const ChatHeader = () => {
    const { selectedUser, clearSelectedChat, selectedChatType } = useChatStore();
    const { selectedGroup, setSelectedGroup } = useGroupStore();
    const { onlineUsers, authUser } = useAuthStore();
    const [showGroupManagement, setShowGroupManagement] = useState(false);

    const isUserChat = selectedChatType === 'user' && selectedUser;
    const isGroupChat = selectedGroup;

    if (!isUserChat && !isGroupChat) return null;

    return (
        <>
            <div className="p-2.5 border-b border-base-300">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="avatar">
                            <div className="size-10 rounded-full relative">
                                {isUserChat ? (
                                    <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
                                ) : (
                                    <img src={selectedGroup.groupProfile || "/avatar.png"} alt={selectedGroup.name} />
                                )}
                                {isGroupChat && (
                                    <div className="absolute -bottom-1 -right-1 bg-primary text-primary-content rounded-full size-5 flex items-center justify-center text-xs font-bold">
                                        {selectedGroup.members.length}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Chat info */}
                        <div>
                            {isUserChat ? (
                                <>
                                    <h3 className="font-medium">{selectedUser.fullName}</h3>
                                    <p className="text-sm text-base-content/70">
                                        {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-medium">{selectedGroup.name}</h3>
                                        {selectedGroup.admin._id === authUser._id && (
                                            <Crown className="size-4 text-yellow-500" title="You are the admin" />
                                        )}
                                    </div>
                                    <p className="text-sm text-base-content/70 flex items-center gap-1">
                                        <Users className="size-3" />
                                        {selectedGroup.members.length} member{selectedGroup.members.length !== 1 ? 's' : ''}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Group settings button */}
                        {isGroupChat && (
                            <button 
                                onClick={() => setShowGroupManagement(true)}
                                className="btn btn-ghost btn-sm btn-circle"
                                title="Group Settings"
                            >
                                <Settings className="size-4" />
                            </button>
                        )}

                        {/* Close button */}
                        <button 
                            onClick={clearSelectedChat}
                            className="btn btn-ghost btn-sm btn-circle"
                            title="Close Chat"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Group Management Modal */}
            {isGroupChat && (
                <GroupManagementModal 
                    isOpen={showGroupManagement}
                    onClose={() => setShowGroupManagement(false)}
                    group={selectedGroup}
                />
            )}
        </>
    );
};
export default ChatHeader;