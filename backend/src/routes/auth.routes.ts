import { Router } from "express";
import {
  registra,
  login,
  google,
  me,
  logout,
  aggiornaAvatar,
} from "../controllers/auth.controller.js";
import { requireAuth, csrfProtection } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = Router();

// Pubbliche (con rate limit anti brute-force)
router.post("/register", authLimiter, registra);
router.post("/login", authLimiter, login);
router.post("/google", authLimiter, google);

// Protette
router.get("/me", requireAuth, me);
router.patch("/avatar", requireAuth, csrfProtection, aggiornaAvatar);
router.post("/logout", requireAuth, csrfProtection, logout);

export default router;
