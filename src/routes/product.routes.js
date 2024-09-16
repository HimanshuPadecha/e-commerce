import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.js"
import { addProduct } from "../controllers/product.controller.js";

const router = Router()

router.route("/add-product").post(verifyJwt,upload.single("picture"),addProduct)

export default router