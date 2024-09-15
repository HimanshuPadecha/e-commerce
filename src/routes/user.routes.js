import { Router } from "express";
import { loginUser, logoutUser, newAccessTokenBasedOnRefresh, registerUser } from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router.route("/logout").get(verifyJwt,logoutUser)
router.route("/refresh").get(verifyJwt,newAccessTokenBasedOnRefresh)

export default router