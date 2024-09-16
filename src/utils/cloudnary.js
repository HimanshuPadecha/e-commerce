import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

export const uploadOnCloudinary = async(localPath)=>{
    try {
        const response = await cloudinary.uploader.upload(localPath,{resource_type:"auto"})
        console.log("uploaded successfully");
        fs.unlinkSync(localPath)
        return response
    } catch (error) {
        fs.unlinkSync(localPath)
        console.log("error while uploading",error);
    }
}