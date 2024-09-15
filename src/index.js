import {app} from "./app.js"
import dotenv from "dotenv"
import { connectDatabase } from "./db/database.connection.js"

dotenv.config({
    path:"./env"
})

connectDatabase().then(()=>{
    app.listen(process.env.PORT || 4000,()=>{
        console.log("the app is running on " + process.env.PORT);
    })
}).catch(error => console.log("error while connecting to database" , error)
)


