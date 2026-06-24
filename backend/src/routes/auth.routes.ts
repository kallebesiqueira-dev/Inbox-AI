import { Router } from "express";
import {
  registra,
  login,
  google,
  me,
  logout,
  aggiornaAvatar,
  aggiornaImpostazioni,
  cambiaPassword,
  passwordDimenticata,
  resetPassword,
} from "../controllers/auth.controller.js";
import { requireAuth, csrfProtection } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = Router();

// Pubbliche (con rate limit anti brute-force)
router.post("/register", authLimiter, registra);
router.post("/login", authLimiter, login);
router.post("/google", authLimiter, google);
router.post("/password-dimenticata", authLimiter, passwordDimenticata);
router.post("/reset-password", authLimiter, resetPassword);

// Protette
router.get("/me", requireAuth, me);
router.patch("/avatar", requireAuth, csrfProtection, aggiornaAvatar);
router.patch("/impostazioni", requireAuth, csrfProtection, aggiornaImpostazioni);
router.post("/cambia-password", requireAuth, csrfProtection, cambiaPassword);
router.post("/logout", requireAuth, csrfProtection, logout);

export default router;
