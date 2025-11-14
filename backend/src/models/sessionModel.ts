// backend/src/models/sessionModel.ts
import mongoose, { Document, Schema } from "mongoose";

export interface ISession extends Document {
  _id: Schema.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  refreshTokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  ip?: string;
  userAgent?: string;
  deviceName?: string;
  revoked?: boolean;
}

const sessionSchema = new Schema<ISession>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  refreshTokenHash: { type: String, required: true, index: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL can be managed manually
  ip: { type: String },
  userAgent: { type: String },
  deviceName: { type: String },
  revoked: { type: Boolean, default: false }
});

const Session = mongoose.model<ISession>("Session", sessionSchema);
export default Session;
