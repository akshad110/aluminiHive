import { RequestHandler } from "express";
import crypto from "crypto";
import {
  isRazorpayConfigured,
  razorpay,
  shouldUseMockPayments,
} from "../config/razorpay";
import Payment from "../models/Payment";

const MOCK_SIGNATURE = "mock_dev_signature";

function isMockOrder(orderId: string): boolean {
  return orderId.startsWith("order_mock_");
}

async function saveCompletedPayment(params: {
  orderId: string;
  paymentId: string;
  studentId: string;
  alumniId: string;
  requestId: string;
  amount: number;
}) {
  const { orderId, paymentId, studentId, alumniId, requestId, amount } = params;

  const paymentRecord = new Payment({
    orderId,
    paymentId,
    studentId,
    alumniId,
    requestId,
    amount,
    currency: "INR",
    status: "completed",
    receipt: `ment_${requestId.slice(-8)}_${Date.now().toString().slice(-6)}`,
    type: "mentorship_call",
  });

  await paymentRecord.save();
  return paymentRecord;
}

function createMockOrderResponse(amount: number, currency: string, requestId: string) {
  const mockOrderId = `order_mock_${Date.now()}`;
  return {
    success: true,
    mock: true,
    order: {
      id: mockOrderId,
      amount: amount * 100,
      currency,
      receipt: `ment_${requestId.slice(-8)}_mock`,
    },
  };
}

export const createPaymentOrder: RequestHandler = async (req, res) => {
  try {
    const { amount, currency = "INR", studentId, alumniId, requestId } = req.body;    if (!amount || !studentId || !alumniId || !requestId) {
      return res.status(400).json({
        error: "Missing required fields: amount, studentId, alumniId, requestId",
      });
    }

    if (shouldUseMockPayments()) {      return res.json(createMockOrderResponse(amount, currency, requestId));
    }

    const options = {
      amount: amount * 100,
      currency,
      receipt: `ment_${requestId.slice(-8)}_${Date.now().toString().slice(-6)}`,
      notes: {
        studentId,
        alumniId,
        requestId,
        type: "mentorship_call",
      },
    };    try {
      const order = await razorpay.orders.create(options);      return res.json({
        success: true,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
        },
        key: process.env.RAZORPAY_KEY_ID,
      });
    } catch (razorpayError: any) {
      if (process.env.NODE_ENV !== "production" && razorpayError?.statusCode === 401) {
        console.warn("Razorpay authentication failed — falling back to mock payment in development");
        return res.json(createMockOrderResponse(amount, currency, requestId));
      }
      throw razorpayError;
    }
  } catch (error: any) {
    console.error("Error creating payment order:", error);

    if (!isRazorpayConfigured()) {
      return res.status(503).json({
        error: "Payment service is not configured",
        details: "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment variables.",
      });
    }

    res.status(500).json({
      error: "Failed to create payment order",
      details: error?.error?.description || error?.message || "Unknown error",
    });
  }
};

export const verifyPayment: RequestHandler = async (req, res) => {
  try {
    const { orderId, paymentId, signature, studentId, alumniId, requestId, amount } = req.body;

    if (!orderId || !paymentId || !studentId || !alumniId || !requestId) {
      return res.status(400).json({
        error: "Missing required fields for payment verification",
      });
    }

    const paymentAmount = Number(amount) || 100;
    const isMockPayment =
      shouldUseMockPayments() &&
      (isMockOrder(orderId) || signature === MOCK_SIGNATURE);

    let verified = false;

    if (isMockPayment) {
      verified = true;    } else if (isRazorpayConfigured()) {
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");
      verified = generatedSignature === signature;
    }

    if (!verified) {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    try {
      const paymentRecord = await saveCompletedPayment({
        orderId,
        paymentId,
        studentId,
        alumniId,
        requestId,
        amount: paymentAmount,
      });      res.json({
        success: true,
        message: isMockPayment
          ? "Mock payment completed successfully (development mode)"
          : "Payment verified and stored successfully",
        paymentId,
        orderId,
        studentId,
        alumniId,
        requestId,
        mock: isMockPayment,
      });
    } catch (dbError) {
      console.error("Error saving payment to database:", dbError);
      res.json({
        success: true,
        message: "Payment verified successfully (database save failed)",
        paymentId,
        orderId,
        studentId,
        alumniId,
        requestId,
        warning: "Payment verified but not saved to database",
      });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ error: "Failed to verify payment" });
  }
};

export const checkPaymentStatus: RequestHandler = async (req, res) => {
  try {
    const { studentId, alumniId, requestId } = req.params;    const payment = await Payment.findOne({
      studentId,
      alumniId,
      requestId,
      status: "completed",
    });    if (payment) {
      res.json({
        success: true,
        hasPaid: true,
        amount: payment.amount,
        currency: payment.currency,
        paymentId: payment.paymentId,
        orderId: payment.orderId,
        createdAt: payment.createdAt,
      });
    } else {
      res.json({
        success: true,
        hasPaid: false,
        amount: 100,
        currency: "INR",
      });
    }
  } catch (error) {
    console.error("Error checking payment status:", error);
    res.status(500).json({ error: "Failed to check payment status" });
  }
};
