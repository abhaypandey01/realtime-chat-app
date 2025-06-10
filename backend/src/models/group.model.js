import mongoose, {Schema} from "mongoose";

const groupSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: "",
    },
    admin: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    members: [{
        type: Schema.Types.ObjectId,
        ref: "User",
    }],
    groupProfile: {
        type: String,
        default: "",
    }
}, {timestamps: true});

const Group = mongoose.model("Group", groupSchema);
export default Group;

