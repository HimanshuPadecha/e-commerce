import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../models/user.model.js"

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



export {registerUser}