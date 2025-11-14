import mongoose, { Schema, Document } from "mongoose";

export interface IFile extends Document {
  ownerId: mongoose.Types.ObjectId;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string; // stored on disk or cloud path
  uploadedAt: Date;
}

const fileSchema = new Schema<IFile>({
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  filePath: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IFile>("File", fileSchema);
