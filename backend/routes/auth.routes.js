import express from "express";
import { signup,login } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";


const router = express.Router();

// Signup route
router.post("/signup", signup);
router.post("/login", login);
router.get("/dashboard", protect, (req, res) => {
  res.json({
    message: `Welcome to your dashboard!${req.user.name}`,
    userId: req.user.id,
    
  });
});



export default router;
