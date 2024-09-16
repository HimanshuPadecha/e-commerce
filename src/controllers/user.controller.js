import {asyncHandler} from "../utils/asyncHandler.js"
import moment from "moment"
import nodemailer from "nodemailer"
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
    const productId = req.params.productId
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

const cancleOrder = asyncHandler(async(req,res)=>{
    const productId = req.params.productId

    if(!productId || !isValidObjectId(productId)){
        throw new ApiError(400,"provide proper productId")
    }

    const productExist = await Product.findById(productId)

    if(!productExist){
        throw new ApiError(404,"Product not found")
    }

    const order = await Order.findOne({orderBy:req.user._id,product:productId})

    if(!order){
        throw new ApiError(404,"You have never ordered this product")
    }

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const userUpdate = await User.findByIdAndUpdate(req.user._id,{
            $pull:{
                orderedItems:`${productId}`
            },
            $set:{
                balance:req.user.balance + productExist.price
            }
        },{new:true,session})

        if(!userUpdate){
            throw new ApiError(500,"error while updating user's placed orders")
        }

        const ownerUpdate = await User.findByIdAndUpdate(order.productOwner,{
            $pull:{
                itemsToDeliver:{
                    customer:`${req.user._id}`,
                    product:`${productId}`
                }
            }
        },{
            new:true,session
        })

        if(!ownerUpdate){
            throw new ApiError(500,"Error while updating owner of the product")
        }

        const orderDeleted = await await Order.findByIdAndDelete(order._id)

        if(!orderDeleted){
            throw new ApiError(500,"Error while deleting order")
        }

        await session.commitTransaction()

        return res
        .status(200)
        .json(200,{message:"oreder is cancled, money credited !!"},"Your order is cancled successfully")
    } catch (error) {
        await session.abortTransaction()
        throw new ApiError(500,`error in transaction : ${error.message}`)
    }finally{
        session.endSession()
    }
})

const addToCart = asyncHandler(async(req,res)=>{
    const productId = req.params.productId

    if(!productId || !isValidObjectId(productId)){
        throw new ApiError(400,"provide proper obj id")
    }

    const productExist = await Product.findById(productId)

    if(!productExist){
        throw new ApiError(404,"Product not found")
    }

    const modified = await User.findOneAndUpdate(req.user._id,{
        $push:{
            cart:`${productId}`
        }
    },{new:true})

    if(!modified){
        throw new ApiError(500,"error while adding in your cart")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,modified,"added to cart !!"))
})

const editUser = asyncHandler(async(req,res)=>{
    const {email,username,address} = req.body

    if(!email || !username || !address) {
        throw new ApiError(400,"provide all the fields")
    }

    const updated = await User.findByIdAndUpdate(req.user._id,{
        $set:{
            email:email || req.user.email,
            username: username || req.user.username,
            address:address || req.user.address
        }
    })

    if(!updated){
        throw new ApiError(500,"error while updating ")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,updated,"details updated !"))
})

const changePassword = asyncHandler(async(req,res)=>{
    const {password} = req.body
    const {newPassword} =req.body
    
    if(!password || newPassword){
        throw new ApiError(400,"Provide proper password")
    }

    const user = await User.findById(req.user._id)

    const isPasswordCorrect = await user.isPasswordCorrect(password) 

    if(!isPasswordCorrect){
        throw new ApiError(406,"Invalid old password")
    }

    const modifiedUser = await User.findByIdAndUpdate(req.user._id,{
        $set:{
            password:newPassword
        }
    },{new:true}).select("-password -refreshToken")

    if(!modifiedUser){
        throw new ApiError(500,"error while changing password")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,modifiedUser,"password changed successfully !!"))
})


const forgotPassword = asyncHandler(async (req,res)=>{
    const {email} = req.body

    if(!email){
        throw new ApiError(400,"Email is required to recover account")
    }

    const user = await User.findOne({email})

    if(!user){
        throw new ApiError(404,"No user exist with the email you entered")
    }

    const otp = Math.floor(Math.random() * 1000000 )

    const otpEntered = await User.findOneAndUpdate(user._id,{
        $set:{
            otp,otpTimeStamp:moment().toISOString()
        }
    },{
        new:true
    }).select("-password -refreshToken -otp -otpTimeStamp")

    if(!otpEntered){
        throw new ApiError(500,"error while setting otp in database")
    }

    const {transporter,mailOptions} = configureForEmail(email,otp)

    await transporter.sendMail(mailOptions)

    return res
    .status(200)
    .json(new ApiResponse(200,otpEntered,"The otp is sent to the email you entered !"))
})

const configureForEmail = (email,otp) =>{
    const transporter = nodemailer.createTransport({
        service:"gmail",
        auth:{
            user:`${process.env.EMAIL}`,
            pass:`${process.env.EMAIL_PASS}`
        }
    })

    const mailOptions = {
        from:"22030401118@darshan.ac.in",
        to:email,
        subject:"To change the password",
        text:`Your otp for changing password is ${otp}, This otp is valid for 10 minutes` 
    }

    return {mailOptions,transporter} 
}

const validateOtp = asyncHandler(async(req,res)=>{
    const {otp,email} = req.body

    if(!otp || (otp<1000000 || otp>999999)){
        throw new ApiError(400,"Invalid otp")
    }

    if(!email){
        throw new ApiError(400,"Email is required to recover account")
    }

    const user = await User.findOne({email})

    if(!user){
        throw new ApiError(404,"No user exist with the email you entered")
    }

    if(otp !== user.otp){
        throw new ApiError(406,"Invalid otp")
    }

    const isOtpInValidTime = moment().isBefore(moment(user.otpTimeStamp).add(10,"minutes"))

    if(!isOtpInValidTime){
        throw new ApiError(406,"Your otp is expired")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,"correct","The otp you entered was correct. you can change the password now"))

})

const changeForgottedPassword = asyncHandler(async(req,res)=>{
    const {password,email} = req.body
    
    if(!password ){
        throw new ApiError(400,"Provide proper password")
    }

    if(!email){
        throw new ApiError(400,"Email is required to recover account")
    }

    const user = await User.findOne({email})

    if(!user){
        throw new ApiError(404,"No user exist with the email you entered")
    }

    const modifiedUser = await User.findByIdAndUpdate(user._id,{
        $set:{
            password
        }
    },{new:true}).select("-password -refreshToken")

    if(!modifiedUser){
        throw new ApiError(500,"error while changing password")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,modifiedUser,"password changed successfully !!"))
})

const getCurrectUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"user fetched successfully"))
})

const getOrders = asyncHandler(async(req,res)=>{

    const products = await User.aggregate([
        {
            $match:{_id:new mongoose.Types.ObjectId(req.user._id)}
        },
        {
            $lookup:{
                from:"products",
                localField:"orderedItems",
                foreignField:"_id",
                as:"Products"
            }
        },
        {
            $project:{
                Products:{
                    picture:1,
                    title:1,
                    price:1,
                    description:1,
                    stats:1
                }
            }
        }
    ])

    if(!products[0].Products.length || !products.length){
        throw new ApiError(404,"No orders placed by you untill now")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,products[0].Products,"Orders fetched successfully"))
})


export {
    registerUser
    ,loginUser,
    logoutUser,
    newAccessTokenBasedOnRefresh,
    placeOrder,
    cancleOrder,
    addToCart,
    editUser,
    changePassword,
    forgotPassword,
    validateOtp,
    changeForgottedPassword,
    getCurrectUser,
    getOrders
}