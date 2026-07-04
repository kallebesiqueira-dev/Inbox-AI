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
import { ah } from "../utils/asyncHandler.js";

const router = Router();

// Pubbliche (con rate limit anti brute-force)
router.post("/register", authLimiter, ah(registra));
router.post("/login", authLimiter, ah(login));
router.post("/google", authLimiter, ah(google));
router.post("/password-dimenticata", authLimiter, ah(passwordDimenticata));
router.post("/reset-password", authLimiter, ah(resetPassword));

// Protette
router.get("/me", ah(requireAuth), ah(me));
router.patch("/avatar", ah(requireAuth), csrfProtection, ah(aggiornaAvatar));
router.patch("/impostazioni", ah(requireAuth), csrfProtection, ah(aggiornaImpostazioni));
router.post("/cambia-password", ah(requireAuth), csrfProtection, ah(cambiaPassword));
router.post("/logout", ah(requireAuth), csrfProtection, ah(logout));

export default router;
