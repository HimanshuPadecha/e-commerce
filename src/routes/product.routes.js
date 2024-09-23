import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.js"
import { addProduct, getProductById, getProducts, modifyProduct, removeProduct } from "../controllers/product.controller.js";

const router = Router()

router.route("/add-product").post(verifyJwt,upload.single("picture"),addProduct)

router.route("/get-product-by-id/:productId").get(getProductById)
router.route("/modify-product/:productId").patch(verifyJwt,upload.none(),modifyProduct)
router.route("/remove-product/:productId").get(verifyJwt,upload.none(),removeProduct)

router.route("/get-products").get(getProducts)


export default router