import mongoose,{Schema} from "mongoose";

const productSchema = new Schema({
    picture:{
        type:String,
        required:true
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    title:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    stats: {
        type: Map,
        of: mongoose.Schema.Types.Mixed, 
        default: {}
    }
    
},{
    timestamps:true
})

export const Product = mongoose.model("Product",productSchema)