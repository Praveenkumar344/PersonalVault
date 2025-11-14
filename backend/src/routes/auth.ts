// backend/src/routes/auth.ts
import express from "express";
import rateLimit from "express-rate-limit";
import {
  registerUser,
  verifyEmail,
  resendVerification,
  loginUser,
  login2FA,
  refreshToken,
  logoutUser,
  getSessions,
  revokeSession,
  generate2FAQr,
  reauth,
  requestPasswordChange,
  confirmPasswordChange
} from "../controllers/authController";
import { validate } from "../middleware/validate";
import { registerSchema, loginSchema } from "../validation/authSchemas";

const router = express.Router();


// Public

router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/verify-2fa", login2FA);
router.post("/generate-2fa", generate2FAQr);

// Refresh (cookie based)
router.post("/refresh", refreshToken);

// Authenticated routes
router.post("/logout", logoutUser);
router.get("/sessions", getSessions);
router.delete("/sessions/:id", revokeSession);

// Reauth endpoint for sensitive actions
router.post("/reauth", reauth);
router.post("/request-password-change", requestPasswordChange);
router.post("/change-password", confirmPasswordChange);

export default router;
