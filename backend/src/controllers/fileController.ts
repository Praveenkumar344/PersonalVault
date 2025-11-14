import { Request, Response } from "express";
import multer from "multer";
import mongoose from "mongoose";
import File from "../models/fileModel";
import User from "../models/userModel";
import { verifyAccessToken } from "../utils/jwt";
import path from "path";
import fs from "fs";

// ----------- Multer Config -----------
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

export const upload = multer({
  storage,
  limits: { fileSize: 16 * 1024 * 1024 }, // 16 MB limit
});

// ----------- Helper -----------
const getUserIdFromToken = (req: Request): string | null => {
  const auth = req.headers.authorization?.split(" ")[1];
  if (!auth) return null;
  const payload: any = verifyAccessToken(auth);
  return payload?.sub || null;
};

// ----------- Upload File -----------
export const uploadFile = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized." });
    if (!req.file) return res.status(400).json({ message: "No file uploaded." });

    const { originalname, mimetype, size, path: filePath } = req.file;

    const newFile = await File.create({
      ownerId: userId,
      fileName: originalname,
      fileType: mimetype,
      fileSize: size,
      filePath,
    });

    await User.findByIdAndUpdate(userId, { $push: { accessibleFiles: newFile._id } });
    res.status(201).json({ message: "File uploaded.", file: {name: newFile.fileName,fileId:newFile._id,fileSize: newFile.fileSize,uploadDate: newFile.uploadedAt} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

// ----------- Get Files -----------
export const getFiles = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized." });

    const user = await User.findById(userId).populate("accessibleFiles");
    res.json({ files: user?.accessibleFiles || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

// ----------- Download File -----------

export const downloadFile = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromToken(req);
    const { id } = req.params;
    if (!userId) return res.status(401).json({ message: "Unauthorized." });

    const file = await File.findById(id);
    if (!file) return res.status(404).json({ message: "File not found." });
    if (file.ownerId.toString() !== userId)
      return res.status(403).json({ message: "Forbidden: Not your file" });

    const filePath = file.filePath;
    if (!fs.existsSync(filePath))
      return res.status(404).json({ message: "File missing on server." });

    res.setHeader("Content-Type", file.fileType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${path.basename(file.fileName)}"`
    );

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

// ----------- Delete File -----------
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromToken(req);
    const { id } = req.params;

    const file = await File.findById(id);
    if (!file) return res.status(404).json({ message: "File not found" });
    if (file.ownerId.toString() !== userId)
      return res.status(403).json({ message: "Forbidden: Not your file" });

    // Remove file from disk
    if (fs.existsSync(file.filePath)) fs.unlinkSync(file.filePath);

    await File.findByIdAndDelete(id);
    await User.findByIdAndUpdate(userId, { $pull: { accessibleFiles: id } });

    res.json({ message: "File deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};
