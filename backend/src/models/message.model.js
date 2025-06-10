import mongoose,{Schema} from "mongoose";

const messageSchema = new Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        // required: true
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
    },
    text: {
        type: String,
    },
    image:{
        type: String,
    }

}, {timestamps: true})

const Message = mongoose.model("Message", messageSchema);

export default Message;