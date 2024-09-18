import mongoose, { isValidObjectId, mongo } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import {Product } from "../models/product.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Feedback } from "../models/feedback.model.js";

const addFeedback = asyncHandler(async(req,res)=>{
    const productId = req.params.productId
    const {content} = req.body

    if(!productId || !isValidObjectId(productId)){
        throw new ApiError(400,"Provide proper product id")
    }

    if(!content){
        throw new ApiError(400,"Provide content for the feedback")
    }

    const product = await Product.findById(productId)

    if(!product){
        throw new ApiError(400,"product does not exist")
    }

    const feedback = await Feedback.create({
        product:productId,
        content,
        feedbackBy:req.user._id
    })

    if(!feedback){
        throw new ApiError(500,"error while creation of the feedback")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,feedback,"feedback added for the product"))
})

const deleteFeedback = asyncHandler(async(req,res)=>{
    const feedbackId = req.params.feedbackId

    if(!feedbackId || !isValidObjectId(feedbackId)){
        throw new ApiError(400,"Provide proper feedbackid")
    }

    const feedback = await Feedback.findById(feedbackId)

    if(!feedback){
        throw new ApiError(404,"feedback does not exist")
    }

    const deleted = await Feedback.findByIdAndDelete(feedbackId)

    if(!deleted){
        throw new ApiError(500,"error while deleting your feedbacks")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,deleted,"Feedback deleted successfully"))
})

const getMyProductsFeedbacks = asyncHandler(async(req,res)=>{
    const productId = req.params.productId

    if(!productId || !isValidObjectId(productId)){
        throw new ApiError(400,"Provide proper product id")
    }

    const product = await Product.findById(productId)

    if(!product){
        throw new ApiError(400,"Product does not exist")
    }

    if(product.owner.toString() !== req.user._id.toString()){
        throw new ApiError(400,"You are not the owner of this product. unable to get the feedback for procuct")
    }

    const feedbacks = await Feedback.aggregate([
        {
            $match:{product:new mongoose.Types.ObjectId(productId)}
        },
        {
            $lookup:{
                from:"users",
                localField:"feedbackBy",
                foreignField:"_id",
                as:"owner"
            }
        },
        {
            $unwind:"$owner"
        },
        {
            $project:{
                owner:{
                    email:1,
                    username:1,
                    address:1
                }
            }
        }
    ])

    if(!feedbacks.length){
        throw new ApiError(404,"No feedbacks on your this product yet")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,feedbacks,"feedbacks fetched "))
})

export {
    addFeedback,
    deleteFeedback,
    getMyProductsFeedbacks
}
