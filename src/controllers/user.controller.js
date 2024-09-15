import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../models/user.model.js"
import mongoose, { isValidObjectId } from "mongoose"
import { Product } from "../models/product.model.js"
import { Order } from "../models/orders.model.js"

const registerUser = asyncHandler(async(req,res)=>{

    const {email,password,username,address,balance} = req.body
    console.log(req.body);
    
    if([email,password,username,address].some(item => item === undefined)){
        throw new ApiError(404,"provide all the fields")
    }

    const userFound = await User.findOne({
        $or:[{email,username}]
    })

    if(userFound){
        throw new ApiError(408,"account already exist")
    }

   const user = await User.create({
    username,
    email,
    password,
    balance,
    address
   })

   const theUser = await User.findById(user._id).select("-password -refreshToken")

   if(!theUser){
    throw new ApiError(500,"something went wrong when adding your database entry")
   }

   return res
   .status(200)
   .json(new ApiResponse(200,theUser,"user created successfully"))
})

const genetateAccessAndRefreshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = await user.genetareAccessToken()
        const refreshToken = await user.genetareRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"error when creating tokens")
    }
}

const loginUser = asyncHandler(async(req,res)=>{
    //check for email and password
    //check if email exist or not 
    //if exist then check the password
    //if pass is correct genetate access and refresh token 
    //send the access token to user in cookies and set the refresh token in database

    const {email,password} = req.body

    if(!email || !password){
        throw new ApiError(400,"please provide email and password both to log in")
    }

    const user = await User.findOne({email})

    if(!user){
        throw new ApiError(404,"No accout exist on this email")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if(!isPasswordCorrect){
        throw new ApiError(408,"password is incorrect")
    }

    const {accessToken,refreshToken} = await genetateAccessAndRefreshTokens(user._id)


    const options = {
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(200,{accessToken,refreshToken},"log in successfully"))
})

const logoutUser = asyncHandler(async(req,res)=>{
    //remove the refresh token from his refresh token field 
    //remove his cookies 

    const user = await User.findByIdAndUpdate(req?.user?._id,{
        $set:{
            refreshToken:""
        }
    },{
        new:true
    }).select("-password -refreshToken")

    if(!user){
        throw new ApiError(500,"error while removing refresh token")
    }

    const options = {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"logged out"))
})

const newAccessTokenBasedOnRefresh = asyncHandler(async(req,res)=>{

    const refreshTokenOld = req.cookies.refreshToken

    if(!refreshTokenOld){
        throw new ApiError(404,"refresh token not found")
    }

    const user = await User.findById(req.user._id)

    if(refreshTokenOld.toString() !== user.refreshToken){
        throw new ApiError(408,"Invalid refresh token")
    }

    const {refreshToken,accessToken} = await genetateAccessAndRefreshTokens(user._id)

    const options ={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(200,{accessToken,refreshToken},"logged in based on accessToken"))
    
})

const placeOrder = asyncHandler(async(req,res)=>{
    const {productId} = req.params
    const {quantity} = req.body

    if(!productId || !isValidObjectId(productId)){
        throw new ApiError(404,"Provide proper product id")
    }

    const productFound = await Product.findById(productId)

    if(!productFound){
        throw new  ApiError(404,"Product does not exist")
    }

    if(productFound.price > req.user.balance){
        throw new ApiError(410,"Not enough money in account, unable to place order")
    }

    const owner = await User.findById(productFound.owner)

    if(!owner){
        throw new ApiError(404,"owner not found. unable to place order")
    }

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const updateItemsTodeliver = await User.findByIdAndUpdate(owner._id,{
            $push:{
                itemsToDeliver:{
                customer:req.user._id,
                product:productId
                }
            }
        },{new:true,session})
    
        if(!updateItemsTodeliver){
            throw new ApiError(500,"error while informing about order")
        }
    
        const pushInOrders = await User.findByIdAndUpdate(req.user._id,{
            $push:{
                orderedItems:productId
            } ,
            $set:{
                balance:req.user.balance-productFound.price
            }   
        },{new:true,session})
    
        if(!pushInOrders){
            throw new ApiError(500,"error while adding your order or substraction money")
        }
    
        const order = await Order.create([{
            orderBy:req.user._id,
            product:productId,
            productOwner:productFound.owner,
            isDelivered:false,
            quantity
        }],{session})
    
        if(!order){
            throw new ApiError(500,"error while placing your order")
        }

        await session.commitTransaction()

        return res
        .status(200)
        .json(new ApiResponse(200,"placed","Order will be delivered to you in 2 days"))
    } catch (error) {

        await session.abortTransaction()
        throw new ApiError(500,`Transaction aborted : ${error.message}`)

    }finally{
        session.endSession()
    }
})

export {registerUser
    ,loginUser,
    logoutUser,
    newAccessTokenBasedOnRefresh,
    placeOrder
}