import mongoose, { Document, Schema } from "mongoose";

export interface IPayment extends Document {
  orderId: string;
  paymentId: string;
  studentId: string;
  alumniId: string;
  requestId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  receipt: string;
  type: 'mentorship_call' | 'subscription' | 'other';
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  studentId: {
    type: String,
    required: true
  },
  alumniId: {
    type: String,
    required: true
  },
  requestId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  receipt: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['mentorship_call', 'subscription', 'other'],
    default: 'mentorship_call'
  }
}, {
  timestamps: true
});

PaymentSchema.index({ studentId: 1, alumniId: 1, requestId: 1 });

export default (mongoose.models.Payment as mongoose.Model<IPayment>) || mongoose.model<IPayment>("Payment", PaymentSchema);
