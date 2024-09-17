import { Router } from "express";
import {verifyJwt} from "../middlewares/auth.middleware.js"
import { addFeedback, deleteFeedback, getMyProductsFeedbacks } from "../controllers/feedback.controller.js";

const router = Router()

router.use(verifyJwt)

router.route("/add-feedback/:productId").post(addFeedback)
router.route("/delete-feedback/:productId").post(deleteFeedback)
router.route("/myProduct-feedbacks/:productId").post(getMyProductsFeedbacks)

export default router