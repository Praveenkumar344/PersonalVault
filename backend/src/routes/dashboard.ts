// backend/src/routes/auth.ts
import express from "express";

import { getVault, updateVault, deleteCredential,createDivision, deleteDivision } from "../controllers/dashboardController";

const router = express.Router();

router.get("/", getVault);
router.post("/update", updateVault);
router.delete("/deleteCredential", deleteCredential);
router.post("/createDivision", createDivision);
router.delete("/deleteDivision", deleteDivision);


export default router;
