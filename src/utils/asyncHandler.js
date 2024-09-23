import { ApiError } from "./ApiError.js"

const asyncHandler = (fn)=>{

    return (req,res,next)=>{
        Promise.resolve(fn(req,res,next)).catch((error)=>{
            if(error instanceof ApiError){
                return res.status(error.statusCode).json({
                    statusCode:error.statusCode,
                    message:error.message
                })
            }
        })
    }
}

export {asyncHandler}