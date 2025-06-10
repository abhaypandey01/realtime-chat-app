import React, { useEffect, useState } from 'react'
import { useChatStore } from '../store/useChatStore';
import { useGroupStore } from '../store/useGroupStore';
import SidebarSkeleton from './skeletons/SidebarSkeleton';
import CreateGroupModal from './CreateGroupModal';
import { Users, MessageCircle, Plus } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

function Sidebar() {

  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading, selectedChatType, clearSelectedChat } = useChatStore();
  const { getUserGroups, groups, selectedGroup, setSelectedGroup, isGroupsLoading } = useGroupStore();
  const { onlineUsers } = useAuthStore();

  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'groups'
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  useEffect(() => { 
    getUsers();
    getUserGroups();
  }, [getUsers, getUserGroups]);

  const filteredUsers = showOnlineOnly ? users.filter((user) => onlineUsers.includes(user._id)) : users;

  const handleUserSelect = (user) => {
    clearSelectedChat(); // Clear any selected group
    setSelectedUser(user);
  };

  const handleGroupSelect = (group) => {
    clearSelectedChat(); // Clear any selected user
    setSelectedGroup(group);
  };

  const handleCreateGroup = () => {
    setShowCreateGroupModal(true);
  };

  if (isUsersLoading || isGroupsLoading) return <SidebarSkeleton />

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        {/* Tabs */}
        <div className="tabs tabs-boxed w-full mb-3">
          <button 
            className={`tab tab-sm flex-1 ${activeTab === 'users' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users className="size-4 lg:mr-2" />
            <span className="hidden lg:inline">Users</span>
          </button>
          <button 
            className={`tab tab-sm flex-1 ${activeTab === 'groups' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('groups')}
          >
            <MessageCircle className="size-4 lg:mr-2" />
            <span className="hidden lg:inline">Groups</span>
          </button>
        </div>

        {/* Users Tab Header */}
        {activeTab === 'users' && (
          <div className="hidden lg:flex items-center gap-2">
            <label className="cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-sm"
              />
              <span className="text-sm">Show online only</span>
            </label>
            <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
          </div>
        )}

        {/* Groups Tab Header */}
        {activeTab === 'groups' && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-base-content/70 hidden lg:block">
              {groups.length} group(s)
            </span>
            <button
              onClick={handleCreateGroup}
              className="btn btn-sm btn-primary"
              title="Create Group"
            >
              <Plus className="size-4" />
              <span className="hidden lg:inline ml-1">Create</span>
            </button>
          </div>
        )}
      </div>

      <div className="overflow-y-auto w-full py-3">
        {/* Users List */}
        {activeTab === 'users' && (
          <>
            {filteredUsers.map((user) => (
              <button
                key={user._id}
                onClick={() => handleUserSelect(user)}
                className={`
                  w-full p-3 flex items-center gap-3
                  hover:bg-base-300 transition-colors
                  ${selectedUser?._id === user._id && selectedChatType === 'user' ? "bg-base-300 ring-1 ring-base-300" : ""}
                `}
              >
                <div className="relative mx-auto lg:mx-0">
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt={user.name}
                    className="size-12 object-cover rounded-full"
                  />
                  {onlineUsers.includes(user._id) && (
                    <span
                      className="absolute bottom-0 right-0 size-3 bg-green-500 
                      rounded-full ring-2 ring-zinc-900"
                    />
                  )}
                </div>

                {/* User info - only visible on larger screens */}
                <div className="hidden lg:block text-left min-w-0">
                  <div className="font-medium truncate">{user.fullName}</div>
                  <div className="text-sm text-zinc-400">
                    {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                  </div>
                </div>
              </button>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center text-zinc-500 py-4">No users found</div>
            )}
          </>
        )}

        {/* Groups List */}
        {activeTab === 'groups' && (
          <>
            {groups.map((group) => (
              <button
                key={group._id}
                onClick={() => handleGroupSelect(group)}
                className={`
                  w-full p-3 flex items-center gap-3
                  hover:bg-base-300 transition-colors
                  ${selectedGroup?._id === group._id ? "bg-base-300 ring-1 ring-base-300" : ""}
                `}
              >
                <div className="relative mx-auto lg:mx-0">
                  <img
                    src={group.groupProfile || "/avatar.png"}
                    alt={group.name}
                    className="size-12 object-cover rounded-full"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-primary text-primary-content rounded-full size-6 flex items-center justify-center text-xs font-bold">
                    {group.members.length}
                  </div>
                </div>

                {/* Group info - only visible on larger screens */}
                <div className="hidden lg:block text-left min-w-0">
                  <div className="font-medium truncate">{group.name}</div>
                  <div className="text-sm text-zinc-400">
                    {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </button>
            ))}

            {groups.length === 0 && (
              <div className="text-center text-zinc-500 py-4">
                <MessageCircle className="size-8 mx-auto mb-2 opacity-50" />
                <p>No groups yet</p>
                <p className="text-xs mt-1">Create your first group!</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal 
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
      />
    </aside>
  );
}

export default Sidebar;