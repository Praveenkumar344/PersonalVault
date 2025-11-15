// backend/src/controllers/authController.ts
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import speakeasy from "speakeasy";
import crypto from "crypto";
import { generateQRCode } from "../utils/generateQR";
import { validateEmail, checkEmailDomain } from "../utils/emailValidator";
import User from "../models/userModel";
import Session from "../models/sessionModel";
import RevokedToken from "../models/revokedTokenModel";
import {
  sendVerificationEmail,
  sendVerificationEmailChangepass,
} from "../utils/mailer";
import { encryptText, sha256Hex, decryptText } from "../utils/crypto";
import { signAccessToken, verifyAccessToken } from "../utils/jwt";
import { v4 as uuidv4 } from "uuid";

const VERIFICATION_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TTL_DAYS = +(process.env.REFRESH_TOKEN_TTL_DAYS || 30);
const REFRESH_TTL_MS = REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000;

// helper: generate a secure token and its sha256 hash
function createVerificationToken() {
  const token = crypto.randomBytes(32).toString("hex"); // raw token sent in email
  const hash = crypto.createHash("sha256").update(token).digest("hex"); // stored in DB
  return { token, hash };
}

function createRawRefreshToken() {
  return crypto.randomBytes(48).toString("hex"); // 48 bytes => 96 hex chars
}

// ---------------------- Register ----------------------
export const registerUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { name, email, password } = req.body as {
      name: string;
      email: string;
      password: string;
    };

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required." });
    if (!validateEmail(email))
      return res.status(400).json({ message: "Invalid email format." });
    if (!(await checkEmailDomain(email)))
      return res.status(400).json({ message: "Invalid email domain." });

    const existingUser = await User.findOne({ email });
    console.log(
      "Existing user check for email",
      email,
      ":",
      existingUser,
      existingUser?.isVerified
    );
    if (existingUser && existingUser?.isVerified)
      return res.status(400).json({ message: "Email already registered." });
    User.deleteOne({ email, isVerified: false }).catch((err) => {
      console.error("Error deleting unverified user:", err);
    });
    // server-side password strengthening recommended
    if (password.length < 8)
      return res.status(400).json({ message: "Password too weak." });

    // hash password (bcrypt; cost 12)
    const hashedPassword = await bcrypt.hash(
      password + (process.env.MASTER_KEY || ""),
      12
    );

    // verification token
    const { token: verificationToken, hash: verificationTokenHash } =
      createVerificationToken();
    const verificationTokenExpiry = new Date(
      Date.now() + VERIFICATION_TOKEN_EXPIRY_MS
    );

    // create user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      twoFASecret: "",
      isVerified: false,
      require2FASetup: true,
      verificationTokenHash,
      verificationTokenExpiry,
    });
    await newUser.save();

    // attempt email send
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (mailErr) {
      console.error("Failed to send verification email:", mailErr);
      // keep user but flag? For demo we return error to show issue.
      return res
        .status(500)
        .json({ message: "Failed to send verification email." });
    }

    return res.status(201).json({
      message: "User registered. Please verify your email.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ---------------------- Verify Email ----------------------
export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const render = (title: string, msg: string, ok = false) => `
  <!doctype html><html><body style="font-family: Inter,system-ui; background:#0a0a0a; color:#fff; min-height:100vh; display:flex;align-items:center;justify-content:center">
  <div style="text-align:center">
    <h1>${title}</h1><p style="padding-bottom:15px">${msg}</p>
    ${
      ok
        ? `<a href="${
            process.env.FRONTEND_URL || "http://localhost:5173"
          }/login" style="padding:12px 12px;background:#5eead4;color:#000;border-radius:8px;text-decoration:none">Go to Login</a>`
        : ""
    }
  </div></body></html>
  `;
  try {
    const token = String(req.query.token || "");
    if (!token)
      return res
        .status(400)
        .send(render("Verification failed", "Token missing."));

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({ verificationTokenHash: tokenHash });
    if (!user)
      return res
        .status(400)
        .send(
          render(
            "Verification failed",
            "Invalid or expired token.<br> Please register again, to get a new verification email."
          )
        );
    if (
      !user.verificationTokenExpiry ||
      user.verificationTokenExpiry < new Date()
    ) {
      return res
        .status(400)
        .send(render("Verification failed", "Token expired."));
    }

    user.isVerified = true;
    user.verificationTokenHash = null;
    user.verificationTokenExpiry = null;
    user.require2FASetup = true;
    await user.save();

    console.log("Email verified for user:", user.email);
    return res
      .status(200)
      .send(
        render(
          "Email verified",
          "Verification successful. You can now log in.",
          true
        )
      );
  } catch (err) {
    console.error(err);
    return res.status(500).send(render("Verification failed", "Server error."));
  }
};

// ---------------------- Resend verification ----------------------
export const resendVerification = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { email } = req.body as { email: string };
    if (!email) return res.status(400).json({ message: "Email required." });
    if (!validateEmail(email))
      return res.status(400).json({ message: "Invalid email." });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.isVerified)
      return res.status(400).json({ message: "User already verified." });

    const { token: newToken, hash: newHash } = (function () {
      const t = crypto.randomBytes(32).toString("hex");
      const h = crypto.createHash("sha256").update(t).digest("hex");
      return { token: t, hash: h };
    })();

    user.verificationTokenHash = newHash;
    user.verificationTokenExpiry = new Date(
      Date.now() + VERIFICATION_TOKEN_EXPIRY_MS
    );
    await user.save();

    try {
      await sendVerificationEmail(email, newToken);
    } catch (err) {
      console.error("Failed to send verification email:", err);
      return res
        .status(500)
        .json({ message: "Failed to send verification email." });
    }
    return res.json({ message: "Verification email resent." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ---------------------- Login (initial) ----------------------
export const loginUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required." });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials." }); // generic message

    // if not verified
    if (!user.isVerified)
      return res.status(403).json({ message: "Account not verified." });

    const ok = await bcrypt.compare(
      password + (process.env.MASTER_KEY || ""),
      user.password
    );
    if (!ok) return res.status(400).json({ message: "Invalid credentials." });

    // If user has 2FA enabled (always present since we generated at register),
    // create a short-lived loginAttempt id and return indicator to ask for OTP.
    // We'll create a temporary attempt record in sessions with a short TTL
    const attemptId = uuidv4();
    const attemptToken = createRawRefreshToken(); // raw token for challenge (one-time)
    const attemptHash = sha256Hex(attemptToken);

    // create a short-lived session record representing this attempt (expires in 5 minutes)
    const attempt = new Session({
      userId: user._id,
      refreshTokenHash: attemptHash,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      deviceName: "login-attempt",
      revoked: false,
    });
    await attempt.save();

    // Return: indicate that 2FA is required and set attempt token in an HttpOnly cookie
    // so frontend will include it automatically (or the frontend can store it in memory)
    res.cookie("login_attempt", attemptToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 5 * 60 * 1000,
      path: "/api/auth",
    });
    return res.json({
      require2FASetup: user.require2FASetup,
      message: "Enter your 2FA code.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ---------------------- Request Password Change ----------------------
export const requestPasswordChange = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { email } = req.body as { email: string };
    if (!email) return res.status(400).json({ message: "Email required." });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    const { token, hash } = createVerificationToken();
    const expiry = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS);

    user.verificationTokenHash = hash;
    user.verificationTokenExpiry = expiry;
    await user.save();

    // Send email with link to reset
    const resetLink = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/change-password?token=${token}`;
    const html = `
      <h2>Password Reset Request</h2>
      <p>We received a request to reset your password.</p>
      <p><a href="${resetLink}" 
   style="display:block;width:fit-content;padding:10px 15px;background:#4f46e5;color:#fff;
          text-decoration:none;border-radius:5px;margin:10px auto;">
  Change Password
</a></p>
      <p>This link will expire in 15 minutes.</p>
    `;
    await sendVerificationEmailChangepass(user.email, token, html);

    return res.json({ message: "Password change email sent." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ---------------------- Confirm Password Change ----------------------
export const confirmPasswordChange = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { token, password } = req.body;
  try {
    // const token = String(req.query.token || "");
    if (!token) return res.status(400).json({ message: "Missing token." });

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({ verificationTokenHash: tokenHash });
    if (!user)
      return res.status(400).json({ message: "Invalid or expired token." });

    if (
      !user.verificationTokenExpiry ||
      user.verificationTokenExpiry < new Date()
    ) {
      return res
        .status(400)
        .json({ message: "This password reset link has expired." });
    }
    const hashedPassword = await bcrypt.hash(
      password + (process.env.MASTER_KEY || ""),
      12
    );

    user.password = hashedPassword;
    user.verificationTokenHash = null;
    user.verificationTokenExpiry = null;
    await user.save();

    return res.status(200).json({ message: "Password Updated successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ---------------------- Setup2FA - generate QR code ----------------------
export const generate2FAQr = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    console.log(req.cookies); // <- check what cookies you get
    const attemptToken = String(req.cookies?.login_attempt || "");
    if (!attemptToken)
      return res.status(400).json({ message: "Missing login attempt." });

    const attemptHash = sha256Hex(attemptToken);
    // find attempt session
    const attempt = await Session.findOne({
      refreshTokenHash: attemptHash,
      deviceName: "login-attempt",
      revoked: false,
    });
    if (!attempt)
      return res
        .status(400)
        .json({ message: "Invalid or expired login attempt." });

    const user = await User.findById(attempt.userId);
    if (!user) return res.status(400).json({ message: "user not found." });

    if (!user.require2FASetup)
      return res.status(400).json({ message: "2FA already set up." });
    // generate 2FA secret (store encrypted)
    const secret = speakeasy.generateSecret({
      name: `personalVault (${user.email})`,
      issuer: "personalVault",
    }) as any;

    const qrCodeUrl = await generateQRCode(secret.otpauth_url);

    console.log(
      "Generated 2FA secret for user:",
      user.email,
      "----",
      secret.base32
    );
    const encryptedSecret = encryptText(secret.base32);
    user.twoFASecret = encryptedSecret;
    user.require2FASetup = false; // mark 2FA as set up
    await user.save();
    // generate QR data URL

    return res.status(201).json({
      message: "qr code generated.",
      qrCodeUrl,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ---------------------- Login 2FA verify ----------------------
export const login2FA = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // OTP should be sent in body
    console.log("logincookies " + req.cookies); // <- check what cookies you get
    const { otp } = req.body as { otp: string };
    console.log("Received OTP:", otp);
    // login_attempt cookie contains raw attempt token (sent in loginUser)
    const attemptToken = String(req.cookies?.login_attempt || "");
    console.log("Received attempt token:", attemptToken);

    if (!attemptToken)
      return res
        .status(400)
        .json({ message: "Session timed out log in again" });

    const attemptHash = sha256Hex(attemptToken);
    // find attempt session
    const attempt = await Session.findOne({
      refreshTokenHash: attemptHash,
      deviceName: "login-attempt",
      revoked: false,
    });
    if (!attempt)
      return res
        .status(400)
        .json({ message: "Invalid or expired login attempt." });

    const user = await User.findById(attempt.userId);
    if (!user) return res.status(400).json({ message: "Invalid attempt." });

    const decryptedSecret = decryptText(user.twoFASecret || "").trim();
    console.log("Decrypted secret:", decryptedSecret);

    const verified = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: "base32",
      token: otp,
      window: 1,
    });
    if (!verified) return res.status(400).json({ message: "Invalid OTP." });

    // OTP ok: delete attempt and cr  eate real session with refresh token
    await Session.deleteOne({ _id: attempt._id });

    // create refresh token (raw), store hash
    const rawRefresh = createRawRefreshToken();
    const refreshHash = sha256Hex(rawRefresh);

    const session = new Session({
      userId: user._id,
      refreshTokenHash: refreshHash,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      ip: req.ip,
      userAgent: req.get("user-agent"),
      deviceName: req.body.deviceName || "Unknown",
    });
    await session.save();

    // rotate: set HttpOnly cookie with raw refresh token (path limited to /api/auth/refresh)
    res.cookie("refresh_token", rawRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: REFRESH_TTL_MS,
      path: "/api/auth/refresh",
    });

    // issue access token (JWT) with session id
    const accessToken = signAccessToken({
      sub: user._id.toString(),
      sid: session._id.toString(),
    });

    return res.json({ accessToken, message: "Logged in." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ---------------------- Refresh (rotate) ----------------------
export const refreshToken = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // cookie contains raw refresh token
    const raw = String(req.cookies?.refresh_token || "");
    if (!raw) return res.status(200).json({ message: "No refresh token." });

    const incomingHash = sha256Hex(raw);
    console.log("Incoming refresh token hash:", incomingHash);
    // find active session
    const session = await Session.findOne({ refreshTokenHash: incomingHash });
    if (!session) {
      // token not found — may be reuse of old rotated token. Check revoked tokens store
      const revoked = await RevokedToken.findOne({ tokenHash: incomingHash });
      if (revoked) {
        // reuse detected: revoke all sessions for user
        await Session.updateMany({ userId: revoked.userId }, { revoked: true });
        console.warn("Detected refresh token reuse for user:", revoked.userId);
        return res
          .status(401)
          .json({ message: "Token reuse detected. All sessions revoked." });
      }
      return res.status(401).json({ message: "Invalid session." });
    }

    if (session.revoked)
      return res.status(401).json({ message: "Session revoked." });
    if (session.expiresAt < new Date())
      return res.status(401).json({ message: "Session expired." });

    // Rotate: create new raw token and hash, save new hash in session, and save the old hash into revoked tokens with expiry
    const oldHash = session.refreshTokenHash;
    const newRaw = createRawRefreshToken();
    const newHash = sha256Hex(newRaw);

    // save revoked record for reuse detection
    const revokedRecord = new RevokedToken({
      tokenHash: oldHash,
      userId: session.userId,
      createdAt: new Date(),
      expireAt: new Date(session.expiresAt), // let revoked record expire when session would have
    });
    await revokedRecord.save();

    // update session with new hash and extended expiry
    session.refreshTokenHash = newHash;
    session.expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
    await session.save();

    // set new cookie
    res.cookie("refresh_token", newRaw, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: REFRESH_TTL_MS,
      path: "/api/auth/refresh",
    });

    // issue new access token
    const accessToken = signAccessToken({
      sub: session.userId.toString(),
      sid: session._id.toString(),
    });

    return res.json({ accessToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ---------------------- Logout ----------------------
export const logoutUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // read refresh token cookie
    const raw = String(req.cookies?.refresh_token || "");
    if (raw) {
      const incomingHash = sha256Hex(raw);
      // revoke session entry if exists
      await Session.updateOne(
        { refreshTokenHash: incomingHash },
        { revoked: true }
      );
      // keep revoked token record so reuse detection triggers if token reused
      const sessionDoc = await Session.findOne({
        refreshTokenHash: incomingHash,
      });
      if (sessionDoc) {
        const rt = new RevokedToken({
          tokenHash: incomingHash,
          userId: sessionDoc.userId,
          createdAt: new Date(),
          expireAt: sessionDoc.expiresAt,
        });
        await rt.save();
      }
    }
    // clear cookie
    res.clearCookie("refresh_token", { path: "/api/auth/refresh" });
    return res.json({ message: "Logged out." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ---------------------- Sessions list & revoke ----------------------
export const getSessions = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // require Authorization header with access token
    const auth = req.headers.authorization?.split(" ")[1];
    if (!auth) return res.status(401).json({ message: "Unauthorized." });

    const payload: any = verifyAccessToken(auth);
    if (!payload) return res.status(401).json({ message: "Invalid token." });

    const userId = payload.sub;
    const sessions = await Session.find({ userId, revoked: false })
      .select("-refreshTokenHash")
      .lean();
    return res.json({ sessions });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

export const revokeSession = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const auth = req.headers.authorization?.split(" ")[1];
    if (!auth) return res.status(401).json({ message: "Unauthorized." });

    const payload: any = verifyAccessToken(auth);
    if (!payload) return res.status(401).json({ message: "Invalid token." });

    const userId = payload.sub;
    const sessionId = req.params.id;
    const s = await Session.findOne({ _id: sessionId, userId });
    if (!s) return res.status(404).json({ message: "Session not found." });

    s.revoked = true;
    await s.save();

    // store its refresh hash into revoked list
    const rt = new RevokedToken({
      tokenHash: s.refreshTokenHash,
      userId: s.userId,
      createdAt: new Date(),
      expireAt: s.expiresAt,
    });
    await rt.save();

    return res.json({ message: "Session revoked." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ---------------------- Reauth endpoint ----------------------
export const reauth = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { otp } = req.body as { otp: string };
    console.log("Received OTP:", otp);
    // login_attempt cookie contains raw attempt token (sent in loginUser)
    const attemptToken = String(req.cookies?.login_attempt || "");
    console.log("Received attempt token:", attemptToken);

    if (!attemptToken)
      return res
        .status(400)
        .json({ message: "Session timed out log in again" });

    const attemptHash = sha256Hex(attemptToken);
    // find attempt session
    const attempt = await Session.findOne({
      refreshTokenHash: attemptHash,
      deviceName: "login-attempt",
      revoked: false,
    });
    if (!attempt)
      return res
        .status(400)
        .json({ message: "Invalid or expired login attempt." });

    const user = await User.findById(attempt.userId);
    if (!user) return res.status(400).json({ message: "Invalid attempt." });

    // verification token
    const { token: verificationToken, hash: verificationTokenHash } =
      createVerificationToken();
    const verificationTokenExpiry = new Date(
      Date.now() + VERIFICATION_TOKEN_EXPIRY_MS
    );

    user.verificationTokenHash = verificationTokenHash;
    user.verificationTokenExpiry = verificationTokenExpiry;
    await user.save();

    // attempt email send
    try {
      await sendVerificationEmail(user.email, verificationToken);
    } catch (mailErr) {
      console.error("Failed to send verification email:", mailErr);
      // keep user but flag? For demo we return error to show issue.
      return res
        .status(500)
        .json({ message: "Failed to send verification email." });
    }
    // success — grant ephemeral reauth token (short lived) — we will return a signed JWT with short life

    return res.status(200).json({ message: "Reauthenticated." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};
