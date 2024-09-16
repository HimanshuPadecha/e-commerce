import { Router } from "express";
import { cancleOrder, loginUser, logoutUser, newAccessTokenBasedOnRefresh, placeOrder, registerUser } from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router.route("/logout").get(verifyJwt,logoutUser)
router.route("/refresh").get(verifyJwt,newAccessTokenBasedOnRefresh)
router.route("/place-order/:productId").post(verifyJwt,placeOrder)
router.route("/cancle-order/:productId").post(verifyJwt,cancleOrder)

export default router