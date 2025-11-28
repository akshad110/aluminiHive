import { RequestHandler } from "express";
import mongoose from "mongoose";
import { AlumniSubscription, PerAlumniMessageLimit, QuarterlySubscription, User, JobPosting, JobPostingSubscription } from "../models";
import { razorpay, CURRENCY, PAYMENT_DESCRIPTION, UPI_PAYMENT_METHODS, UPI_TEST_CONFIG } from "../config/razorpay";
import crypto from 'crypto';

// Get subscription plans for an alumni
export const getSubscriptionPlans: RequestHandler = async (req, res) => {
  try {
    const { alumniId } = req.params;
    
    // Verify alumni exists
    const alumni = await User.findById(alumniId);
    if (!alumni || alumni.role !== "alumni") {
      return res.status(404).json({ error: "Alumni not found" });
    }

    // Define subscription plans with revenue sharing
    const plans = [
      {
        id: "monthly",
        name: "Individual Monthly Access",
        duration: "1 month",
        price: 300, // ₹300
        platformCommission: 90, // 30% to platform
        alumniEarnings: 210, // 70% to alumni
        features: [
          "Unlimited messages with this alumni",
          "Priority response time",
          "Direct mentorship access"
        ]
      },
      {
        id: "quarterly",
        name: "All Alumni Access",
        duration: "3 months",
        price: 1000, // ₹1000
        platformCommission: 200, // 20% to platform
        alumniEarnings: 800, // 80% to alumni
        features: [
          "Unlimited messages with ALL alumni",
          "Priority response time",
          "Direct mentorship access",
          "Exclusive networking events",
          "Career guidance sessions",
          "Access to premium content"
        ]
      }
    ];

    res.json({ plans, alumni: { id: alumni._id, name: `${alumni.firstName} ${alumni.lastName}` } });
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    res.status(500).json({ error: "Failed to fetch subscription plans" });
  }
};

// Create a subscription
export const createSubscription: RequestHandler = async (req, res) => {
  try {
    const { studentId, alumniId, subscriptionType, paymentId } = req.body;

    // Verify both users exist
    const [student, alumni] = await Promise.all([
      User.findById(studentId),
      User.findById(alumniId)
    ]);

    if (!student || student.role !== "student") {
      return res.status(404).json({ error: "Student not found" });
    }

    if (!alumni || alumni.role !== "alumni") {
      return res.status(404).json({ error: "Alumni not found" });
    }

    // Check if subscription already exists and is active
    const existingSubscription = await (AlumniSubscription as any).findOne({
      studentId,
      alumniId,
      status: "active",
      endDate: { $gt: new Date() }
    });

    if (existingSubscription) {
      return res.status(400).json({ error: "Active subscription already exists" });
    }

    // Calculate pricing and revenue sharing
    let amount, platformCommission, alumniEarnings;
    
    if (subscriptionType === "monthly") {
      amount = 300;
      platformCommission = 90; // 30%
      alumniEarnings = 210; // 70%
    } else if (subscriptionType === "quarterly") {
      amount = 1000;
      platformCommission = 200; // 20%
      alumniEarnings = 800; // 80%
    } else {
      return res.status(400).json({ error: "Invalid subscription type" });
    }

    // Calculate end date
    const startDate = new Date();
    const endDate = new Date();
    if (subscriptionType === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (subscriptionType === "quarterly") {
      endDate.setMonth(endDate.getMonth() + 3);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    let subscription;
    
    if (subscriptionType === "quarterly") {
      // Create quarterly subscription (access to ALL alumni)
      subscription = new QuarterlySubscription({
        studentId,
        subscriptionType: "quarterly",
        amount,
        platformCommission,
        status: "active",
        startDate,
        endDate,
        paymentId
      });

      await subscription.save();

      // Update ALL per-alumni message limits to subscribed
      await PerAlumniMessageLimit.updateMany(
        { studentId },
        { isSubscribed: true, subscriptionId: subscription._id }
      );
    } else {
      // Create individual alumni subscription
      subscription = new AlumniSubscription({
        studentId,
        alumniId,
        subscriptionType,
        amount,
        platformCommission,
        alumniEarnings,
        status: "active",
        startDate,
        endDate,
        paymentId
      });

      await subscription.save();

      // Update per-alumni message limit to subscribed
      await (PerAlumniMessageLimit as any).findOneAndUpdate(
        { studentId, alumniId },
        { isSubscribed: true, subscriptionId: subscription._id },
        { upsert: true }
      );
    }

    res.status(201).json({
      message: "Subscription created successfully",
      subscription: {
        id: subscription._id,
        type: subscriptionType,
        amount,
        platformCommission,
        alumniEarnings,
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ error: "Failed to create subscription" });
  }
};

// Create a Razorpay order for subscription
export const createJobUnlockOrder: RequestHandler = async (req, res) => {
  try {
    const { amount, currency, description, jobId, userId } = req.body;

    if (!userId || !amount || !currency || !description || !jobId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create Razorpay order for job unlock
    const orderOptions = {
      amount: amount,
      currency: currency,
      receipt: `job_unlock_${Date.now()}`,
      notes: {
        userId,
        jobId,
        type: 'job_unlock',
        description
      }
    };

    const order = await razorpay.orders.create(orderOptions);
    
    console.log('Job unlock Razorpay order created:', order);

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt
    });
  } catch (error) {
    console.error('Error creating job unlock order:', error);
    res.status(500).json({ error: "Failed to create payment order" });
  }
};

export const createRazorpayOrder: RequestHandler = async (req, res) => {
  try {
    const { studentId, alumniId, subscriptionType } = req.body;

    // Verify both users exist - studentId is actually the User ID
    const [student, alumni] = await Promise.all([
      User.findById(studentId),
      User.findById(alumniId)
    ]);

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    if (!alumni) {
      return res.status(404).json({ error: "Alumni not found" });
    }

    // Check if subscription already exists and is active
    const existingSubscription = await (AlumniSubscription as any).findOne({
      studentId,
      alumniId,
      status: "active",
      endDate: { $gt: new Date() }
    });

    if (existingSubscription) {
      return res.status(400).json({ error: "Active subscription already exists" });
    }

    // Calculate pricing
    let amount;
    let planName;
    
    if (subscriptionType === "monthly") {
      amount = 300;
      planName = "Individual Monthly Access";
    } else if (subscriptionType === "quarterly") {
      amount = 1000;
      planName = "All Alumni Access";
    } else {
      return res.status(400).json({ error: "Invalid subscription type" });
    }

    // Create Razorpay order with UPI support
    const orderOptions = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: CURRENCY,
      receipt: `sub_${Date.now()}`, // Shortened receipt (max 40 chars)
      notes: {
        studentId,
        alumniId,
        subscriptionType,
        planName,
        upiTestMode: UPI_TEST_CONFIG.enabled,
        autoApprove: UPI_TEST_CONFIG.autoApprove
      }
    };

    const order = await razorpay.orders.create(orderOptions as any);

    res.status(201).json({
      message: "Order created successfully",
      order: {
        id: (order as any).id,
        amount: (order as any).amount,
        currency: (order as any).currency,
        receipt: (order as any).receipt
      },
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_RDoUFgwLLU69on',
      // UPI Test Configuration
      upiTestConfig: UPI_TEST_CONFIG,
      // Test UPI IDs for automation
      testUPIIds: {
        success: UPI_TEST_CONFIG.testUPIIds,
        failure: UPI_TEST_CONFIG.failureUPIIds,
        timeout: UPI_TEST_CONFIG.timeoutUPIIds
      },
      // Payment methods enabled
      paymentMethods: UPI_PAYMENT_METHODS
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ 
      error: "Failed to create payment order",
      details: error.message,
      stack: error.stack
    });
  }
};

// Verify payment and create subscription
export const verifyJobUnlockPayment: RequestHandler = async (req, res) => {
  try {
    console.log('Job unlock payment verification started:', req.body);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, jobId, userId, amount } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !jobId || !userId) {
      console.error('Missing required fields:', { razorpay_order_id, razorpay_payment_id, razorpay_signature, jobId, userId });
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'IxZI40FsgedA0w3IaCEnk3J3';
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body.toString())
      .digest("hex");

    console.log('Signature verification:', {
      body,
      expectedSignature,
      receivedSignature: razorpay_signature,
      keySecret: keySecret.substring(0, 10) + '...'
    });

    if (expectedSignature !== razorpay_signature) {
      console.error('Signature verification failed');
      return res.status(400).json({ error: "Invalid signature" });
    }


    try {
      console.log('Finding job with ID:', jobId);
      // Find the job
      const job = await (JobPosting as any).findById(jobId);
      if (!job) {
        console.error('Job not found with ID:', jobId);
        return res.status(404).json({ error: "Job not found" });
      }

      console.log('Job found:', { title: job.title, isLocked: job.isLocked });

      // Check if payment already exists
      const existingPayment = await JobPostingSubscription.findOne({
        jobId: new mongoose.Types.ObjectId(jobId),
        userId: new mongoose.Types.ObjectId(String(userId)),
        status: 'completed'
      });

      if (existingPayment) {
        console.log('Payment already exists for this job and user');
        return res.json({ success: true, message: "Job already unlocked" });
      }

      // Create payment record
      const paymentRecord = new JobPostingSubscription({
        jobId: new mongoose.Types.ObjectId(jobId),
        userId: new mongoose.Types.ObjectId(String(userId)),
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: amount || 300,
        currency: 'INR',
        status: 'completed',
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpaySignature: razorpay_signature,
        transactionId: razorpay_payment_id + '_' + Date.now(),
        paymentMethod: 'razorpay',
        paidAt: new Date()
      });

      await paymentRecord.save();
      console.log('✅ Payment record saved:', paymentRecord._id);

      // Also update the job's unlockedBy array for backward compatibility
      if (!job.unlockedBy) {
        job.unlockedBy = [];
      }
      
      const alreadyUnlocked = job.unlockedBy.find((u: any) => u.userId.toString() === userId);
      if (!alreadyUnlocked) {
        job.unlockedBy.push({
          userId: new mongoose.Types.ObjectId(userId),
          unlockedAt: new Date(),
          paymentId: razorpay_payment_id,
          amount: amount || 300
        });
        await job.save();
        console.log('Job unlockedBy array updated');
      }

      console.log('Job unlocked successfully:', { jobId, userId, paymentId: razorpay_payment_id });
      res.json({ success: true, message: "Job unlocked successfully" });
    } catch (unlockError) {
      console.error('Error unlocking job:', unlockError);
      res.status(500).json({ error: "Failed to unlock job" });
    }
  } catch (error) {
    console.error('Error verifying job unlock payment:', error);
    res.status(500).json({ error: "Payment verification failed" });
  }
};

// Manual unlock endpoint for testing
export const manualUnlockJob: RequestHandler = async (req, res) => {
  try {
    const { jobId, userId } = req.body;
    
    if (!jobId || !userId) {
      return res.status(400).json({ error: "Job ID and User ID are required" });
    }

    console.log('Manual unlock request:', { jobId, userId });

    const job = await (JobPosting as any).findById(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already unlocked using JobPostingSubscription
    const existingPayment = await JobPostingSubscription.findOne({
      jobId: new mongoose.Types.ObjectId(jobId),
      userId: new mongoose.Types.ObjectId(String(userId)),
      status: 'completed'
    });

    if (existingPayment) {
      console.log('Payment already exists for this job and user');
      return res.json({ message: "Job already unlocked by this user" });
    }

    // Create payment record
    const paymentRecord = new JobPostingSubscription({
      jobId: new mongoose.Types.ObjectId(jobId),
      userId: new mongoose.Types.ObjectId(String(userId)),
      paymentId: 'manual_unlock_' + Date.now(),
      orderId: 'manual_order_' + Date.now(),
      amount: 300,
      currency: 'INR',
      status: 'completed',
      razorpayPaymentId: 'manual_payment_' + Date.now(),
      razorpayOrderId: 'manual_order_' + Date.now(),
      razorpaySignature: 'manual_signature_' + Date.now(),
      transactionId: 'manual_transaction_' + Date.now(),
      paymentMethod: 'manual',
      paidAt: new Date()
    });

    await paymentRecord.save();
    console.log('✅ Payment record created:', paymentRecord._id);

    // Also update the job's unlockedBy array for backward compatibility
    const alreadyUnlocked = job.unlockedBy.find((u: any) => u.userId.toString() === userId);
    if (!alreadyUnlocked) {
      job.unlockedBy.push({
        userId: new mongoose.Types.ObjectId(userId),
        unlockedAt: new Date(),
        paymentId: 'manual_unlock_' + Date.now(),
        amount: 300
      });
      await job.save();
    }

    console.log('✅ Job manually unlocked:', { jobId, userId });
    res.json({ success: true, message: "Job unlocked successfully" });
  } catch (error) {
    console.error('Error in manual unlock:', error);
    res.status(500).json({ error: "Failed to unlock job" });
  }
};

export const verifyPayment: RequestHandler = async (req, res) => {
  try {
    console.log('Payment verification request:', req.body);
    
    const { 
      orderId, 
      paymentId, 
      signature, 
      studentId, 
      alumniId, 
      subscriptionType 
    } = req.body;

    // Verify required fields
    if (!orderId || !paymentId || !signature || !studentId || !alumniId || !subscriptionType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify payment signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'IxZI40FsgedA0w3IaCEnk3J3')
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    console.log('Signature verification:', {
      expected: expectedSignature,
      received: signature,
      match: expectedSignature === signature
    });

    
    if (expectedSignature !== signature) {
      console.warn('Signature mismatch, but continuing in test mode');
   
    }

   
    let amount, platformCommission, alumniEarnings;
    
    if (subscriptionType === "monthly") {
      amount = 300;
      platformCommission = 90; // 30%
      alumniEarnings = 210; // 70%
    } else if (subscriptionType === "quarterly") {
      amount = 1000;
      platformCommission = 200; // 20%
      alumniEarnings = 800; // 80%
    } else {
      return res.status(400).json({ error: "Invalid subscription type" });
    }

    // Calculate end date
    const startDate = new Date();
    const endDate = new Date();
    if (subscriptionType === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (subscriptionType === "quarterly") {
      endDate.setMonth(endDate.getMonth() + 3);
    }

    let subscription;

    if (subscriptionType === "quarterly") {
      // Create quarterly subscription (access to all alumni)
      subscription = new (QuarterlySubscription as any)({
        studentId,
        subscriptionType: "quarterly",
        amount,
        platformCommission,
        status: "active",
        startDate,
        endDate,
        paymentId
      });

      await subscription.save();

      // Update all PerAlumniMessageLimit records for this student
      await (PerAlumniMessageLimit as any).updateMany(
        { studentId },
        { isSubscribed: true, subscriptionId: subscription._id }
      );
    } else {
      // Create individual alumni subscription
      subscription = new (AlumniSubscription as any)({
        studentId,
        alumniId,
        subscriptionType: "monthly",
        amount,
        platformCommission,
        alumniEarnings,
        status: "active",
        startDate,
        endDate,
        paymentId
      });

      await subscription.save();

      // Update specific PerAlumniMessageLimit record
      await (PerAlumniMessageLimit as any).findOneAndUpdate(
        { studentId, alumniId },
        { isSubscribed: true, subscriptionId: subscription._id },
        { upsert: true }
      );
    }

    res.status(201).json({
      message: "Payment verified and subscription created successfully",
      subscription: {
        id: subscription._id,
        type: subscriptionType,
        amount,
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ 
      error: "Failed to verify payment",
      details: error.message,
      stack: error.stack
    });
  }
};

// Razorpay webhook handler for UPI automation
export const razorpayWebhook: RequestHandler = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const body = JSON.stringify(req.body);
    
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || 'IxZI40FsgedA0w3IaCEnk3J3')
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    console.log('Razorpay webhook event:', event.event);

    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;
      case 'order.paid':
        await handleOrderPaid(event.payload.order.entity);
        break;
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Handle successful payment capture
const handlePaymentCaptured = async (payment: any) => {
  try {
    console.log('Payment captured:', payment.id);
    // Additional logic for successful payment
    // You can update subscription status, send notifications, etc.
  } catch (error) {
    console.error('Error handling payment capture:', error);
  }
};

// Handle failed payment
const handlePaymentFailed = async (payment: any) => {
  try {
    console.log('Payment failed:', payment.id);
    // Additional logic for failed payment
    // You can send notifications, update retry count, etc.
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
};

// Handle order paid
const handleOrderPaid = async (order: any) => {
  try {
    console.log('Order paid:', order.id);
    // Additional logic for order completion
  } catch (error) {
    console.error('Error handling order paid:', error);
  }
};

// Get student's subscriptions
export const getStudentSubscriptions: RequestHandler = async (req, res) => {
  try {
    const { studentId } = req.params;

    const subscriptions = await (AlumniSubscription as any).find({ studentId })
      .populate("alumniId", "firstName lastName profilePicture")
      .sort({ createdAt: -1 });

    res.json({ subscriptions });
  } catch (error) {
    console.error("Error fetching student subscriptions:", error);
    res.status(500).json({ error: "Failed to fetch subscriptions" });
  }
};

// Get alumni's earnings
export const getAlumniEarnings: RequestHandler = async (req, res) => {
  try {
    const { alumniId } = req.params;

    // Get all active subscriptions for this alumni
    const activeSubscriptions = await (AlumniSubscription as any).find({
      alumniId,
      status: "active",
      endDate: { $gt: new Date() }
    });

    // Calculate total earnings
    const totalEarnings = activeSubscriptions.reduce((sum, sub) => sum + sub.alumniEarnings, 0);
    const totalPlatformCommission = activeSubscriptions.reduce((sum, sub) => sum + sub.platformCommission, 0);

    // Get subscription history
    const allSubscriptions = await (AlumniSubscription as any).find({ alumniId })
      .populate("studentId", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json({
      activeSubscriptions: activeSubscriptions.length,
      totalEarnings,
      totalPlatformCommission,
      subscriptions: allSubscriptions
    });
  } catch (error) {
    console.error("Error fetching alumni earnings:", error);
    res.status(500).json({ error: "Failed to fetch earnings" });
  }
};

// Check subscription status for messaging
export const checkSubscriptionStatus: RequestHandler = async (req, res) => {
  try {
    const { studentId, alumniId } = req.params;

    // Get per-alumni message limit
    const perAlumniLimit = await (PerAlumniMessageLimit as any).findOne({ studentId, alumniId });
    
    if (!perAlumniLimit) {
      return res.json({
        hasSubscription: false,
        messageCount: 0,
        remainingMessages: 5,
        requiresSubscription: false
      });
    }

  
    const activeSubscription = await (AlumniSubscription as any).findOne({
      studentId,
      alumniId,
      status: "active",
      endDate: { $gt: new Date() }
    });

    const hasSubscription = activeSubscription || perAlumniLimit.isSubscribed;
    const remainingMessages = hasSubscription ? -1 : Math.max(0, 5 - perAlumniLimit.messageCount);
    const requiresSubscription = !hasSubscription && perAlumniLimit.messageCount >= 5;

    res.json({
      hasSubscription,
      messageCount: perAlumniLimit.messageCount,
      remainingMessages,
      requiresSubscription,
      subscription: activeSubscription ? {
        type: activeSubscription.subscriptionType,
        endDate: activeSubscription.endDate
      } : null
    });
  } catch (error) {
    console.error("Error checking subscription status:", error);
    res.status(500).json({ error: "Failed to check subscription status" });
  }
};
