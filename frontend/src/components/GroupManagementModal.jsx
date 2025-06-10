import { useState, useRef } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { 
  X, 
  Image, 
  Users, 
  UserPlus, 
  UserMinus, 
  Crown, 
  Settings,
  LogOut,
  Trash2,
  Edit
} from "lucide-react";
import toast from "react-hot-toast";

const GroupManagementModal = ({ isOpen, onClose, group }) => {
  const [activeTab, setActiveTab] = useState("details");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: group?.name || "",
    description: group?.description || "",
  });
  const [imagePreview, setImagePreview] = useState(group?.groupProfile || null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const fileInputRef = useRef(null);
  
  const { 
    updateGroup, 
    addGroupMembers, 
    removeGroupMember, 
    leaveGroup, 
    deleteGroup,
    isUpdatingGroup, 
    isAddingMembers, 
    isRemovingMember, 
    isLeavingGroup, 
    isDeletingGroup 
  } = useGroupStore();
  
  const { users } = useChatStore();
  const { authUser } = useAuthStore();

  if (!group) return null;

  const isAdmin = group.admin._id === authUser._id;
  const availableUsers = users.filter(user => 
    !group.members.some(member => member._id === user._id)
  );

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateGroup = async () => {
    if (!formData.name.trim()) {
      toast.error("Group name is required");
      return;
    }

    try {
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
      };
      
      if (selectedFile) {
        updateData.groupProfile = selectedFile;
      }

      await updateGroup(group._id, updateData);
      setEditMode(false);
      setSelectedFile(null);
    } catch (error) {
      console.error("Failed to update group:", error);
    }
  };

  const handleAddMembers = async () => {
    if (selectedMembers.length === 0) {
      toast.error("Please select members to add");
      return;
    }

    try {
      await addGroupMembers(group._id, selectedMembers);
      setSelectedMembers([]);
      toast.success(`Added ${selectedMembers.length} member(s)`);
    } catch (error) {
      console.error("Failed to add members:", error);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await removeGroupMember(group._id, memberId);
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  const handleLeaveGroup = async () => {
    if (window.confirm("Are you sure you want to leave this group?")) {
      try {
        await leaveGroup(group._id);
        onClose();
      } catch (error) {
        console.error("Failed to leave group:", error);
      }
    }
  };

  const handleDeleteGroup = async () => {
    if (window.confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      try {
        await deleteGroup(group._id);
        onClose();
      } catch (error) {
        console.error("Failed to delete group:", error);
      }
    }
  };

  const toggleMemberSelection = (userId) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-base-300">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings className="size-5" />
            Group Settings
          </h2>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed p-4 bg-base-200">
          <button 
            className={`tab ${activeTab === "details" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("details")}
          >
            Details
          </button>
          <button 
            className={`tab ${activeTab === "members" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("members")}
          >
            Members ({group.members.length})
          </button>
          {isAdmin && (
            <button 
              className={`tab ${activeTab === "manage" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("manage")}
            >
              Manage
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Details Tab */}
          {activeTab === "details" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-base-300 flex items-center justify-center overflow-hidden">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Group"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="size-12 text-base-content/50" />
                    )}
                  </div>
                  {editMode && isAdmin && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 btn btn-sm btn-circle btn-primary"
                    >
                      <Image className="size-3" />
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                />

                {editMode ? (
                  <div className="w-full space-y-3">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="input input-bordered w-full"
                      placeholder="Group name"
                    />
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="textarea textarea-bordered w-full resize-none"
                      placeholder="Group description"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateGroup}
                        className="btn btn-primary btn-sm"
                        disabled={isUpdatingGroup}
                      >
                        {isUpdatingGroup ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => {
                          setEditMode(false);
                          setFormData({
                            name: group.name,
                            description: group.description,
                          });
                          setImagePreview(group.groupProfile);
                          setSelectedFile(null);
                        }}
                        className="btn btn-outline btn-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <h3 className="text-xl font-bold">{group.name}</h3>
                    {group.description && (
                      <p className="text-base-content/70 mt-2">{group.description}</p>
                    )}
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Crown className="size-4 text-yellow-500" />
                      <span className="text-sm">Admin: {group.admin.fullName}</span>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => setEditMode(true)}
                        className="btn btn-outline btn-sm mt-3"
                      >
                        <Edit className="size-4" />
                        Edit Group
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === "members" && (
            <div className="space-y-4">
              <div className="grid gap-3">
                {group.members.map((member) => (
                  <div key={member._id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img
                        src={member.profilePic || "/avatar.png"}
                        alt={member.fullName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <div className="font-medium">{member.fullName}</div>
                        <div className="text-sm text-base-content/70">{member.email}</div>
                      </div>
                      {member._id === group.admin._id && (
                        <Crown className="size-4 text-yellow-500" />
                      )}
                    </div>
                    {isAdmin && member._id !== authUser._id && (
                      <button
                        onClick={() => handleRemoveMember(member._id)}
                        className="btn btn-sm btn-outline btn-error"
                        disabled={isRemovingMember}
                      >
                        <UserMinus className="size-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manage Tab (Admin Only) */}
          {activeTab === "manage" && isAdmin && (
            <div className="space-y-6">
              {/* Add Members */}
              <div>
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <UserPlus className="size-4" />
                  Add Members
                </h4>
                {availableUsers.length > 0 ? (
                  <div className="space-y-2">
                    {availableUsers.map((user) => (
                      <label key={user._id} className="flex items-center gap-3 p-2 hover:bg-base-200 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={selectedMembers.includes(user._id)}
                          onChange={() => toggleMemberSelection(user._id)}
                        />
                        <img
                          src={user.profilePic || "/avatar.png"}
                          alt={user.fullName}
                          className="w-8 h-8 rounded-full"
                        />
                        <span>{user.fullName}</span>
                      </label>
                    ))}
                    {selectedMembers.length > 0 && (
                      <button
                        onClick={handleAddMembers}
                        className="btn btn-primary btn-sm mt-3"
                        disabled={isAddingMembers}
                      >
                        {isAddingMembers ? "Adding..." : `Add ${selectedMembers.length} Member(s)`}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-base-content/70">No users available to add</p>
                )}
              </div>

              {/* Danger Zone */}
              <div className="border border-error rounded-lg p-4">
                <h4 className="font-bold text-error mb-3">Danger Zone</h4>
                <div className="space-y-2">
                  <button
                    onClick={handleDeleteGroup}
                    className="btn btn-error btn-sm w-full"
                    disabled={isDeletingGroup}
                  >
                    <Trash2 className="size-4" />
                    {isDeletingGroup ? "Deleting..." : "Delete Group"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-base-300 bg-base-200">
          {!isAdmin && (
            <button
              onClick={handleLeaveGroup}
              className="btn btn-outline btn-error w-full"
              disabled={isLeavingGroup}
            >
              <LogOut className="size-4" />
              {isLeavingGroup ? "Leaving..." : "Leave Group"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupManagementModal;

