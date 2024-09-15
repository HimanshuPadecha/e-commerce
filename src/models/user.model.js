import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
const userSchema = new Schema({
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    password:{
        type:String,
        required:true
    },
    username:{
        type:String,
        required:true,
        lowercase:true,
        trim:true,
        unique:true
    },
    address:{
        type:String,
        required:true
    },
    orderedItems:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Product"
        }
    ],
    itemsToDeliver:[
        {
           customer:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"User"
           },
           product:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Product"
           },
        }
    ],
    cart:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Product"
        }
    ],
    balance:{
        type:Number,
        required:true
    },
    refreshToken:{
        type:String,
        default:""
    },
    
},{
    timestamps:true
})

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password,10)
    return next()
}
)

userSchema.methods.isPasswordCorrect =async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.genetareAccessToken = async function(){
    return jwt.sign(
        {
            _id:this._id
        },
        process.env.ACCESS_TOKEN_SECRET,{
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}


userSchema.methods.genetareRefreshToken = async function(){
    return jwt.sign(
        {
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECRET,{
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User",userSchema)