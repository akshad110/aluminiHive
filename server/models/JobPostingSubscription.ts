import mongoose, { Schema, Document } from 'mongoose';

export interface IJobPostingSubscription extends Document {
  jobId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
  transactionId: string;
  paymentMethod: string;
  paidAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const JobPostingSubscriptionSchema = new Schema<IJobPostingSubscription>({
  jobId: {
    type: Schema.Types.ObjectId,
    ref: 'JobPosting',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  paymentId: {
    type: String,
    required: true
  },
  orderId: {
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
  razorpayPaymentId: {
    type: String,
    required: true
  },
  razorpayOrderId: {
    type: String,
    required: true
  },
  razorpaySignature: {
    type: String,
    required: true
  },
  transactionId: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    default: 'razorpay'
  },
  paidAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
JobPostingSubscriptionSchema.index({ jobId: 1, userId: 1 });
JobPostingSubscriptionSchema.index({ paymentId: 1 }, { unique: true });
JobPostingSubscriptionSchema.index({ transactionId: 1 }, { unique: true });

export const JobPostingSubscription = (mongoose.models.JobPostingSubscription as mongoose.Model<IJobPostingSubscription>) || mongoose.model<IJobPostingSubscription>('JobPostingSubscription', JobPostingSubscriptionSchema);
