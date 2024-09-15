import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product"
    },
    content:{
        type:String,
        required:true,
    },
    feedbackBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
},{
    timestamps:true
})

export const Feedback = mongoose.model("Feedback",feedbackSchema)