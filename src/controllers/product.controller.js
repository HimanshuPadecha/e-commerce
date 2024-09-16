import { asyncHandler } from "../utils/asyncHandler.js";
import {uploadOnCloudinary} from "../utils/cloudnary.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Product } from "../models/product.model.js";

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

export {addProduct}