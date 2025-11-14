import express from "express";
import {
  upload,
  uploadFile,
  getFiles,
  downloadFile,
  deleteFile,
} from "../controllers/fileController";

const router = express.Router();

router.post("/upload", upload.single("file"), uploadFile);
router.get("/", getFiles);
router.get("/download/:id", downloadFile);
router.delete("/delete/:id", deleteFile);

export default router;
