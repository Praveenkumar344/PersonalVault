import { Request, Response } from "express";
import UserVault from "../models/userVaultModel";
import { verifyAccessToken } from "../utils/jwt";
import { encryptText, decryptText } from "../utils/crypto";
import User from "../models/userModel";

// Helper: extract and verify access token
const getUserIdFromToken = (req: Request): string | null => {
  const auth = req.headers.authorization?.split(" ")[1];
  console.log("Authorization header token:", auth);
  if (!auth) return null;
  const payload: any = verifyAccessToken(auth);
  return payload?.sub || null;
};

// ---------------- GET VAULT ----------------
export const getVault = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized." });
    const vault = await UserVault.findOne({ userId });

    const user = await User.findOne({ _id:userId });
    if (!user) return res.status(400).json({ message: "Invalid credentials." }); // generic message

if (!vault) return res.json({ name:user.name,divisions: [] });
// Decrypt passwords before sending to frontend
    const decryptedVault = vault.divisions.map((div) => ({
      id: div._id!.toString(),
      name: div.name,
      credentials: div.credentials.map((c) => ({
        id: c._id!.toString(),
        site: c.site,
        username: c.username,
        password: decryptText(c.password),
      })),
    }));

    return res.json({name:user.name, divisions: decryptedVault });
  } catch (err) {
    console.error("getVault error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ---------------- createDivision ----------------
export const createDivision = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized." });
    const { divisionName } = req.body;
    if (!divisionName) return res.status(400).json({ message: "Division name required." });
    let vault = await UserVault.findOne({ userId });
    if (!vault) vault = new UserVault({ userId, divisions: [] });
    const existingDivision = vault.divisions.find((d) => d.name === divisionName);
    if (existingDivision) {
      return res.status(400).json({ message: "Division already exists." });
    }
    vault.divisions.push({ name: divisionName, credentials: [] });
    await vault.save();
    return res.json({ message: "Division created successfully." });
  } catch (err) {
    console.error("createDivision error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ---------------- ADD OR UPDATE ----------------
export const updateVault = async (req: Request, res: Response): Promise<Response> => {
  try {
    console.log("updateVault called with body:", req.body);
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized." });

    const { divisionName, site, username, password } = req.body;
    if (!divisionName || !site || !username || !password)
      return res.status(400).json({ message: "All fields are required." });

    const encryptedPassword = encryptText(password);

    let vault = await UserVault.findOne({ userId });
    if (!vault) vault = new UserVault({ userId, divisions: [] });

    let division = vault.divisions.find((d) => d.name === divisionName);
    if (!division) {
      division = { name: divisionName, credentials: [] };
      vault.divisions.push(division);
    }

    const existing = division.credentials.find((c) => c.site === site);
    if (existing) {
      existing.username = username;
      existing.password = encryptedPassword;
    } else {
      division.credentials.push({ site, username, password: encryptedPassword });
    }

    await vault.save();
    return res.json({ message: "Credential saved/updated successfully." });
  } catch (err) {
    console.error("updateVault error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ---------------- DELETE CREDENTIAL ----------------
export const deleteCredential = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized." });

    const { divisionName, site } = req.body;
    if (!divisionName || !site)
      return res.status(400).json({ message: "Division name and site required." });

    const vault = await UserVault.findOne({ userId });
    if (!vault) return res.status(404).json({ message: "Vault not found." });

    const division = vault.divisions.find((d) => d.name === divisionName);
    if (!division) return res.status(404).json({ message: "Division not found." });

    division.credentials = division.credentials.filter((c) => c.site !== site);
    await vault.save();

    return res.json({ message: "Credential deleted successfully." });
  } catch (err) {
    console.error("deleteCredential error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ---------------- DELETE DIVISION ----------------
export const deleteDivision = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized." });

    const { divisionName } = req.body;
    if (!divisionName) return res.status(400).json({ message: "Division name required." });

    const vault = await UserVault.findOne({ userId });
    if (!vault) return res.status(404).json({ message: "Vault not found." });

    vault.divisions = vault.divisions.filter((d) => d.name !== divisionName);
    await vault.save();

    return res.json({ message: "Division deleted successfully." });
  } catch (err) {
    console.error("deleteDivision error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};
