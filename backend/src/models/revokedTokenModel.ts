// backend/src/models/revokedTokenModel.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IRevokedToken extends Document {
  tokenHash: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  expireAt: Date;
}

const revokedSchema = new Schema<IRevokedToken>({
  tokenHash: { type: String, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  expireAt: { type: Date, required: true, index: { expires: 0 } },
});

const RevokedToken = mongoose.model<IRevokedToken>("RevokedToken", revokedSchema);
export default RevokedToken;
