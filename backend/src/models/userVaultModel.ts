// backend/src/models/userVaultModel.ts
import mongoose, { Schema, Document } from "mongoose";

export interface Credential {
  _id?: mongoose.Types.ObjectId;
  site: string;
  username: string;
  password: string;
}

export interface Division {
  _id?: mongoose.Types.ObjectId;
  name: string; // e.g., "work", "personal", "banking"
  credentials: Credential[];
}

export interface UserVaultDocument extends Document {
  userId: mongoose.Types.ObjectId;
  divisions: Division[];
  updatedAt: Date;
}

const credentialSchema = new Schema<Credential>({
  site: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true }, // should be encrypted before saving
});

const divisionSchema = new Schema<Division>({
  name: { type: String, required: true },
  credentials: { type: [credentialSchema], default: [] },
});

const userVaultSchema = new Schema<UserVaultDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    divisions: { type: [divisionSchema], default: [] },
  },
  { timestamps: { updatedAt: true, createdAt: false } }
);

const UserVault = mongoose.model<UserVaultDocument>("UserVault", userVaultSchema);
export default UserVault;
