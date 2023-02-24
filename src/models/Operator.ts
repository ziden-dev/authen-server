import mongoose from "mongoose";

const Operator = new mongoose.Schema({
    userId: String,
    role: Number,
    claimId: String,
    createAt: Number,
    adminId: String,
    activate: Boolean
});

export default mongoose.model("Operator", Operator);