import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  id?: string;
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  avatar?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  id: { type: String },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String },
  googleId: { type: String },
  avatar: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
