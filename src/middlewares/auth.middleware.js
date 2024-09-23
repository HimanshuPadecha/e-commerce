import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

const verifyJwt = asyncHandler(async(req,_,next)=>{
    //get access token from header or req
    //decode the token
    //compare the decoded token's id to user's id and compare the token where it found in database
    //if yes then add the user in body and next

    console.log(req.cookies);
    
    const accessToken = req.cookies?.accessToken || req.header("Authorizion")?.replace("bearer ","")

    if(!accessToken){
        throw new ApiError(404,"Login to Use this service")
    }

    const decodedToken = await jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET)

    const user = await User.findById(decodedToken._id).select("-password -refreshToken -otp")

    if(!user){
        throw new ApiError(409,"Invlid token")
    }

    req.user = user
    next()
})

export {verifyJwt}

