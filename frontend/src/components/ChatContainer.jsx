import { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { format } from "date-fns";


function ChatContainer() {
  const { 
    messages, 
    getMessages, 
    isMessagesLoading, 
    selectedUser, 
    subscribeToMessages, 
    unsubscribeFromMessages,
    selectedChatType 
  } = useChatStore();
  
  const { 
    groupMessages, 
    getGroupMessages, 
    isGroupMessagesLoading, 
    selectedGroup, 
    subscribeToGroupMessages, 
    unsubscribeFromGroupMessages 
  } = useGroupStore();
  
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  const isUserChat = selectedChatType === 'user' && selectedUser;
  const isGroupChat = selectedGroup;
  const currentMessages = isGroupChat ? groupMessages : messages;
  const isLoading = isGroupChat ? isGroupMessagesLoading : isMessagesLoading;

  useEffect(() => {
    if (isUserChat) {
      getMessages(selectedUser._id);
      subscribeToMessages();
      
      return () => unsubscribeFromMessages();
    } else if (isGroupChat) {
      getGroupMessages(selectedGroup._id);
      subscribeToGroupMessages();
      
      return () => unsubscribeFromGroupMessages();
    }
  }, [
    selectedUser?._id, 
    selectedGroup?._id, 
    isUserChat, 
    isGroupChat,
    getMessages, 
    getGroupMessages,
    subscribeToMessages, 
    subscribeToGroupMessages,
    unsubscribeFromMessages,
    unsubscribeFromGroupMessages
  ]);

  useEffect(() => {
    if(messageEndRef.current && currentMessages){
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentMessages])

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    )
  }

  const renderMessageSender = (message) => {
    if (isUserChat) {
      return message.senderId === authUser._id ? authUser : selectedUser;
    } else {
      // For group chats, we need to find the sender from group members
      if (message.senderId === authUser._id) {
        return authUser;
      }
      return selectedGroup.members.find(member => member._id === message.senderId) || {
        _id: message.senderId,
        fullName: 'Unknown User',
        profilePic: '/avatar.png'
      };
    }
  };

  const getMessageContent = (message) => {
    if (isGroupChat) {
      // Group messages might have populated sender info
      return {
        ...message,
        senderInfo: message.senderId === authUser._id ? authUser : 
          (message.senderId?.fullName ? message.senderId : renderMessageSender(message))
      };
    }
    return message;
  };

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentMessages.map((message) => {
          const messageData = getMessageContent(message);
          const sender = renderMessageSender(message);
          const isOwnMessage = message.senderId === authUser._id || 
            (typeof message.senderId === 'object' && message.senderId._id === authUser._id);
          
          return (
            <div
              key={message._id}
              className={`chat ${isOwnMessage ? 'chat-end' : 'chat-start'}`}
              ref={messageEndRef}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img 
                    src={sender.profilePic || "/avatar.png"} 
                    alt="profile-pic" 
                  />
                </div>
              </div>
              
              <div className="chat-header mb-1">
                {isGroupChat && !isOwnMessage && (
                  <span className="text-xs font-semibold mr-2">
                    {sender.fullName}
                  </span>
                )}
                <time className="text-xs opacity-50">
                  {format(new Date(message.createdAt), "HH:mm")}
                </time>
              </div>
              
              <div className="chat-bubble flex flex-col">
                {message.image && (
                  <img 
                    src={message.image} 
                    alt="Attachment" 
                    className="sm:max-w-[200px] rounded-md mb-2" 
                  />
                )}
                {message.text && <p>{message.text}</p>}
              </div>
            </div>
          );
        })}
        
        {currentMessages.length === 0 && (
          <div className="text-center text-base-content/50 py-8">
            <p>No messages yet</p>
            <p className="text-sm mt-1">
              {isGroupChat ? "Start the conversation in this group!" : "Send a message to start chatting"}
            </p>
          </div>
        )}
      </div>

      <MessageInput />
    </div>
  )
}

export default ChatContainer;