import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { toggle } from "../controllers/deviceController.js";

const deviceRouter = Router();

deviceRouter.patch("/:id/toogle", protect, toggle);

export default deviceRouter;