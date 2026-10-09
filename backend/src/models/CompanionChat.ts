import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICompanionMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ICompanionChat extends Document {
  sessionId: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  guestId?: string;
  companionName: string;
  companionRole: string;
  sessionStartTime: Date;
  lastActiveTime: Date;
  durationSeconds: number;
  messagesCount: number;
  userMessagesCount: number;
  messages: ICompanionMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const CompanionMessageSchema = new Schema<ICompanionMessage>(
  {
    role: { type: String, required: true, enum: ['user', 'assistant'] },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CompanionChatSchema = new Schema<ICompanionChat>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, index: true },
    userEmail: { type: String, index: true },
    userName: { type: String, default: 'Guest' },
    guestId: { type: String, index: true },
    companionName: { type: String, required: true, index: true },
    companionRole: { type: String, required: true },
    sessionStartTime: { type: Date, default: Date.now, index: true },
    lastActiveTime: { type: Date, default: Date.now },
    durationSeconds: { type: Number, default: 0 },
    messagesCount: { type: Number, default: 0 },
    userMessagesCount: { type: Number, default: 0 },
    messages: [CompanionMessageSchema],
  },
  {
    timestamps: true,
  }
);

export const CompanionChat: Model<ICompanionChat> =
  mongoose.models.CompanionChat || mongoose.model<ICompanionChat>('CompanionChat', CompanionChatSchema);
