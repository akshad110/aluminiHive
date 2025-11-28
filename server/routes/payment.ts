import { RequestHandler } from "express";
import crypto from "crypto";
import { razorpay } from "../config/razorpay";
import Payment from "../models/Payment";
export const createPaymentOrder: RequestHandler = async (req, res) => {
  try {
    const { amount, currency = "INR", studentId, alumniId, requestId } = req.body;

    console.log('Payment order request body:', req.body);

    if (!amount || !studentId || !alumniId || !requestId) {
      console.log('Missing required fields:', { amount, studentId, alumniId, requestId });
      return res.status(400).json({ 
        error: "Missing required fields: amount, studentId, alumniId, requestId" 
      });
    }

    const options = {
      amount: amount * 100,
      currency,
      receipt: `ment_${requestId.slice(-8)}_${Date.now().toString().slice(-6)}`,
      notes: {
        studentId,
        alumniId,
        requestId,
        type: "mentorship_call"
      }
    };

    console.log('Creating Razorpay order with options:', options);

    const order = await razorpay.orders.create(options);

    console.log('Razorpay order created successfully:', order.id);

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      },
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_RDoUFgwLLU69on'
    });
  } catch (error) {
    console.error("Error creating payment order:", error);
    console.error("Error details:", {
      message: error.message,
      statusCode: error.statusCode,
      error: error.error
    });
    res.status(500).json({ 
      error: "Failed to create payment order",
      details: error.message 
    });
  }
};

export const verifyPayment: RequestHandler = async (req, res) => {
  try {
    const { orderId, paymentId, signature, studentId, alumniId, requestId } = req.body;

    if (!orderId || !paymentId || !studentId || !alumniId || !requestId) {
      return res.status(400).json({ 
        error: "Missing required fields for payment verification" 
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'IxZI40FsgedA0w3IaCEnk3J3';
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (generatedSignature === signature) {
      console.log('Payment verified successfully:', {
        orderId,
        paymentId,
        studentId,
        alumniId,
        requestId
      });

      try {
        const paymentRecord = new Payment({
          orderId,
          paymentId,
          studentId,
          alumniId,
          requestId,
          amount: 300,
          currency: 'INR',
          status: 'completed',
          receipt: `ment_${requestId.slice(-8)}_${Date.now().toString().slice(-6)}`,
          type: 'mentorship_call'
        });

        await paymentRecord.save();
        console.log('Payment record saved to database:', paymentRecord._id);

        res.json({
          success: true,
          message: "Payment verified and stored successfully",
          paymentId,
          orderId,
          studentId,
          alumniId,
          requestId
        });
      } catch (dbError) {
        console.error('Error saving payment to database:', dbError);
        res.json({
          success: true,
          message: "Payment verified successfully (database save failed)",
          paymentId,
          orderId,
          studentId,
          alumniId,
          requestId,
          warning: "Payment verified but not saved to database"
        });
      }
    } else {
      res.status(400).json({ error: "Payment verification failed" });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ error: "Failed to verify payment" });
  }
};

export const checkPaymentStatus: RequestHandler = async (req, res) => {
  try {
    const { studentId, alumniId, requestId } = req.params;

    console.log('Checking payment status for:', { studentId, alumniId, requestId });

    const payment = await Payment.findOne({
      studentId,
      alumniId,
      requestId,
      status: 'completed'
    });

    console.log('Payment record found:', payment ? 'Yes' : 'No');

    if (payment) {
      res.json({
        success: true,
        hasPaid: true,
        amount: payment.amount,
        currency: payment.currency,
        paymentId: payment.paymentId,
        orderId: payment.orderId,
        createdAt: payment.createdAt
      });
    } else {
      res.json({
        success: true,
        hasPaid: false,
        amount: 300,
        currency: "INR"
      });
    }
  } catch (error) {
    console.error("Error checking payment status:", error);
    res.status(500).json({ error: "Failed to check payment status" });
  }
};
