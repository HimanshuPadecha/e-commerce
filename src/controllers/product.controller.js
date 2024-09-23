import { asyncHandler } from "../utils/asyncHandler.js";
import {uploadOnCloudinary} from "../utils/cloudnary.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Product } from "../models/product.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Feedback } from "../models/feedback.model.js";

const addProduct = asyncHandler(async(req,res)=>{
    //check for all the things
    //find if the product already exist
    //upload the picture on cloudinary
    //create a document 
    //send res

    const {title,description,price,stats} = req.body

    if([title,description].some(item => item.trim() === "")){
        throw new ApiError(400,"Provide proper title and desctiption for product")
    }

    const alreadyExist = await Product.findOne({title,description})

    if(alreadyExist && alreadyExist.owner.toString().equals(req.body._id.toString())){
        throw new ApiError(409,"The same product from you already exist")        
    }

    const localPathPicture = req?.file?.path

    if(!localPathPicture){
        throw new ApiError(404,"Picture for the product is important")
    }

    const response = await uploadOnCloudinary(localPathPicture)
    console.log(response);
    
    if(!response){
        throw new ApiError(500,"error while uploading your image")
    }

    const product = await Product.create({
        title,
        description,
        price,
        owner:req.user._id,
        stats:stats || {},
        picture:response?.url
    })

    if(!product){
        throw new ApiError(500,"error while making document")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,product,"product created successfully !"))
})

const removeProduct = asyncHandler(async(req,res)=>{
    const productId = req.params.productId

    if(!productId || !isValidObjectId(productId)){
        throw new ApiError(400,"Provide proper id")
    }

    const product = await Product.findById(productId)

    if(!product){
        throw new ApiError(404,"Product not found")
    }

    if(product.owner.toString() !== req.user._id.toString()){
        throw new ApiError(408,"You are not the owner of this product ")
    }

    const order = await User.findOne({orderedItems:productId})

    if(order){
        throw new ApiError(409,"someone have ordered this product unable to delete this product")
    }

    const updatedAll = await User.updateMany({cart:productId},{
        $pull:{
            cart:productId
        }
    })

    if(!updatedAll){
        throw new ApiError(500,"error while removing product from users' carts")
    }

    await Feedback.deleteMany({product:productId})

    const deleteProduct = await Product.findByIdAndDelete(productId)

    if(!deleteProduct){
        throw new ApiError(500,"error while deleting product ")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,deleteProduct,"product deleted successfully"))
})

const getProductById = asyncHandler(async(req,res)=>{
    const productId = req.params.productId

    if(!productId || !isValidObjectId(productId)){
        throw new ApiError(400,"Provide proper id")
    }

    const product = await Product.findById(productId)

    if(!product){
        throw new ApiError(404,"Product not found")
    }

    const productFromDb = await Product.aggregate([
        {
            $match:{_id:new mongoose.Types.ObjectId(productId)}
        },
        {
            $lookup:{
                from:"feedbacks",
                localField:"_id",
                foreignField:"product",
                as:"feedbacks",
                pipeline:[
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
                                username:1
                            },content:1,
                            _id:0
                        }
                    }
                ]
            }
        },
        {
            $project:{
                picture:1,
                title:1,
                price:1,
                description:1,
                stats:1,
                feedbacks:1,
                
            }
        }
    ])

    if(!productFromDb){
        throw new ApiError(500,"error while getting product")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,productFromDb[0],"Product fetched successfully"))
})

const modifyProduct = asyncHandler(async(req,res)=>{
    const productId = req.params.productId
    const {title,description,price,stats} = req.body

    if(!productId || !isValidObjectId(productId)){
        throw new ApiError(400,"Provide proper product id")
    }

    if(!title && !description && !price && !stats ){
        throw new ApiError(400,"atleast provide one field")
    }

    const product = await Product.findById(productId)

    if(!product){
        throw new ApiError(404,"Product not found")
    }

    if(product.owner.toString() !== req.user._id.toString()){
        throw new ApiError(408,"You are not the owner of this product unable to make any change")
    }

    const updated = await Product.findByIdAndUpdate(productId,{
        $set:{
            title: title || product.title,
            description: description || product.description,
            price: price || product.price,
            stats:stats || product.stats        
        }
    },{
        new:true
    })

    if(!updated){
        throw new ApiError(500,"error while updating ")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,updated,"product updated"))
})

const getProducts = asyncHandler(async(req,res)=>{


    const {page = 1, limit = 6} = req.query

    const products = await Product.find()
        .limit(limit *1)
        .skip((page - 1) * limit)

    const count = await Product.countDocuments()

    const totalPages = Math.ceil(count / limit)
    
    return res
    .status(200)
    .json(new ApiResponse(200,{products,totalPages},"Products fetched successfully"))
})

export {
    addProduct,
    getProductById,
    modifyProduct,
    removeProduct,
    getProducts
}