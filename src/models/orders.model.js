import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema({
    orderBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
        },
    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product"
    },
    productOwner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    isDelivered:{
        type:Boolean,
        default:false
    },
    quantity:{
        type:Number,
        default:1
    }
},{timestamps:true})

export const Order = mongoose.model("Order",orderSchema)