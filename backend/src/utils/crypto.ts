// backend/src/utils/crypto.ts
import crypto from "crypto";

const ALGO = "aes-256-gcm";
const MASTER_KEY_HEX = process.env.MASTER_KEY || "";

if (!MASTER_KEY_HEX || MASTER_KEY_HEX.length !== 64) {
  throw new Error("MASTER_KEY must be set to 64 hex chars (32 bytes). Generate via crypto.randomBytes(32).toString('hex')");
}
const MASTER_KEY = Buffer.from(MASTER_KEY_HEX, "hex");

export function encryptText(plain: string) {
  const iv = crypto.randomBytes(12); // 96-bit
  const cipher = crypto.createCipheriv(ALGO, MASTER_KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}.${tag.toString("hex")}.${ciphertext.toString("hex")}`;
}

export function decryptText(payload: string) {
  const [ivHex, tagHex, cipherHex] = payload.split(".");
  if (!ivHex || !tagHex || !cipherHex) throw new Error("Invalid payload");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const ciphertext = Buffer.from(cipherHex, "hex");
  const decipher = crypto.createDecipheriv(ALGO, MASTER_KEY, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}

// helper to hash refresh tokens (sha256)
export function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}
