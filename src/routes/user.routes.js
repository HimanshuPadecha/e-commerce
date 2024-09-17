import { Router } from "express";
import { addToCart, cancleOrder, changeForgottedPassword, changePassword, editUser, forgotPassword, getCart, getCurrectUser, getMyProducts, getOrders, getOrdersToDeliver, loginUser, logoutUser, newAccessTokenBasedOnRefresh, placeOrder, registerUser, removeFromCart, searchProduct, validateOtp } from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router.route("/logout").get(verifyJwt,logoutUser)
router.route("/refresh").get(verifyJwt,newAccessTokenBasedOnRefresh)
router.route("/place-order/:productId").post(verifyJwt,placeOrder)
router.route("/cancle-order/:productId").post(verifyJwt,cancleOrder)
router.route("/add-to-cart/:productId").post(verifyJwt,addToCart)
router.route("/edit-user").post(verifyJwt,editUser)
router.route("/change-password").post(verifyJwt,changePassword)
router.route("/forgot-password").post(forgotPassword)
router.route("/forgot-password").post(forgotPassword)
router.route("/validate-otp").post(validateOtp)
router.route("/change-forgotted-password").post(changeForgottedPassword)
router.route("/get-current-user").get(verifyJwt,getCurrectUser)
router.route("/get-current-user").get(verifyJwt,getCurrectUser)
router.route("/get-orders").get(verifyJwt,getOrders)
router.route("/get-orders-to-deliver").get(verifyJwt,getOrdersToDeliver)
router.route("/get-cart").get(verifyJwt,getCart)
router.route("/search-product").post(verifyJwt,searchProduct)
router.route("/get-my-products").post(verifyJwt,getMyProducts)
router.route("/remove-from-cart").post(verifyJwt,removeFromCart)

export default router