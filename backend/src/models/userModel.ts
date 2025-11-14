import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  _id: Schema.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  twoFASecret?: string;
  isVerified: boolean;
  verificationTokenHash?: string | null;
  verificationTokenExpiry?: Date | null;
  require2FASetup: boolean;
  accessibleFiles: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    twoFASecret: { type: String },
    isVerified: { type: Boolean, default: false },
    verificationTokenHash: { type: String, default: null },
    verificationTokenExpiry: { type: Date, default: null },
    require2FASetup: { type: Boolean, default: true },
    accessibleFiles: [{ type: Schema.Types.ObjectId, ref: "File" }],
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>("User", userSchema);
export default User;
