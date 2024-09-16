import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import multer from "multer"

const upload = multer()
const app = express()

app.use(cors({credentials:true,origin:process.env.CORS_ORIGIN}))

app.use(cookieParser())

app.use(express.json({limit:"16kb"}))

app.use(express.urlencoded({extended:true,limit:"16kb"}))

app.use(express.static("public"))

import userRoute from "./routes/user.routes.js"
import ProductRoute from "./routes/product.routes.js"

app.use("/api/v1/users",upload.none(),userRoute)
app.use("/api/v1/products",ProductRoute)

export {app}
