import React from 'react'
import { useChatStore } from '../store/useChatStore'
import { useGroupStore } from '../store/useGroupStore'
import Sidebar from '../components/Sidebar';
import NoChatSelected from '../components/NoChatSelected';
import ChatContainer from '../components/ChatContainer';

function HomePage() {

  const { selectedUser, selectedChatType } = useChatStore();
  const { selectedGroup } = useGroupStore();
  
  const hasActiveChat = (selectedChatType === 'user' && selectedUser) || selectedGroup;

  return (
    <div className='h-screen bg-base-200'>
      <div className='flex items-center justify-center pt-20 px-4'>
        <div className='bg-base-100 rounded-lg shadow-xl w-full max-w-6xl h-cal[(100vh-8rem)]'>
          <div className='flex h-full rounded-lg overflow-hidden '>

            <Sidebar />
            {!hasActiveChat ? <NoChatSelected /> : <ChatContainer />}

          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage 