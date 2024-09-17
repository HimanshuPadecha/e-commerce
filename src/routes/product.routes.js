import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.js"
import { addProduct, getProductById, modifyProduct } from "../controllers/product.controller.js";

const router = Router()

router.route("/add-product").post(verifyJwt,upload.single("picture"),addProduct)

router.route("/get-product-by-id/:productId").get(verifyJwt,getProductById)
router.route("/modify-product/:productId").get(verifyJwt,upload.none(),modifyProduct)

export default router