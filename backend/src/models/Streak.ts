import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStreak extends Document {
  userId: mongoose.Types.ObjectId;
  currentStreak: number;
  maxStreak: number;
  totalActiveDays: number;
  freezeTokens: number;
  lastCheckIn?: Date;
  history: string[]; // List of YYYY-MM-DD dates with check-ins
  activityCounts: Record<string, number>; // Map of YYYY-MM-DD -> number of activities
  updatedAt: Date;
}

const StreakSchema = new Schema<IStreak>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    currentStreak: { type: Number, default: 0 },
    maxStreak: { type: Number, default: 0 },
    totalActiveDays: { type: Number, default: 0 },
    freezeTokens: { type: Number, default: 2 }, // 2 free freeze tokens to protect streak
    lastCheckIn: { type: Date },
    history: [{ type: String }],
    activityCounts: { type: Map, of: Number, default: {} }
  },
  { timestamps: true }
);

export const Streak: Model<IStreak> = mongoose.models.Streak || mongoose.model<IStreak>('Streak', StreakSchema);
