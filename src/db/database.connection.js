import mongoose from "mongoose";

const connectDatabase = async ()=>{

    try {
        const response = await mongoose.connect(`${process.env.CONNECTION_STRING}/${process.env.DATABASE_NAME}`)
        console.log("Database is connected");
        return response
    } catch (error) {
        console.log("error in connection",error);
        process.exit(1)
    }
}

export {connectDatabase}