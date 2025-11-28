import { RequestHandler } from "express";
import mongoose from "mongoose";
import { MessageLimit } from "../models/MessageLimit";
import { Subscription } from "../models/Subscription";

// Get message limit status for a user
export const getMessageLimitStatus: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    
    let messageLimit = await MessageLimit.findOne({ userId });
    
    // Create message limit record if it doesn't exist
    if (!messageLimit) {
      messageLimit = new MessageLimit({
        userId,
        dailyMessageCount: 0,
        lastResetDate: new Date(),
        totalMessagesSent: 0,
        subscriptionStatus: "free",
      });
      await messageLimit.save();
    }
    
    // Check for active subscriptions
    const activeSubscription = await Subscription.findOne({
      userId,
      status: "active",
      endDate: { $gt: new Date() }
    });
    
    const isPremium = activeSubscription || messageLimit.subscriptionStatus === "premium";
    const remainingMessages = isPremium ? -1 : Math.max(0, 5 - messageLimit.dailyMessageCount);
    
    res.json({
      dailyMessageCount: messageLimit.dailyMessageCount,
      remainingMessages,
      isPremium,
      subscription: activeSubscription,
      lastResetDate: messageLimit.lastResetDate,
      totalMessagesSent: messageLimit.totalMessagesSent
    });
  } catch (error) {
    console.error("Error getting message limit status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Check if user can send message
export const canSendMessage: RequestHandler = async (req, res) => {
  try {
    const { userId, targetUserId } = req.body;
    
    let messageLimit = await MessageLimit.findOne({ userId });
    
    if (!messageLimit) {
      messageLimit = new MessageLimit({
        userId,
        dailyMessageCount: 0,
        lastResetDate: new Date(),
        totalMessagesSent: 0,
        subscriptionStatus: "free",
      });
      await messageLimit.save();
    }
    
    // Check for active subscriptions
    const activeSubscription = await Subscription.findOne({
      userId,
      status: "active",
      endDate: { $gt: new Date() },
      $or: [
        { subscriptionType: "unlimited" },
        { targetUserId: targetUserId }
      ]
    });
    
    const isPremium = activeSubscription || messageLimit.subscriptionStatus === "premium";
    const canSend = isPremium || messageLimit.dailyMessageCount < 5;
    
    res.json({
      canSend,
      isPremium,
      remainingMessages: isPremium ? -1 : Math.max(0, 5 - messageLimit.dailyMessageCount),
      subscription: activeSubscription
    });
  } catch (error) {
    console.error("Error checking message limit:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Increment message count after sending
export const incrementMessageCount: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.body;
    
    const messageLimit = await MessageLimit.findOneAndUpdate(
      { userId },
      { 
        $inc: { 
          dailyMessageCount: 1, 
          totalMessagesSent: 1 
        } 
      },
      { new: true, upsert: true }
    );
    
    res.json({ success: true, messageLimit });
  } catch (error) {
    console.error("Error incrementing message count:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create subscription
export const createSubscription: RequestHandler = async (req, res) => {
  try {
    const { userId, targetUserId, subscriptionType, amount, paymentId } = req.body;
    
    // Calculate end date (30 days from now)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    const subscription = new Subscription({
      userId,
      targetUserId: subscriptionType === "individual" ? targetUserId : undefined,
      subscriptionType,
      amount,
      paymentId,
      endDate,
      status: "active"
    });
    
    await subscription.save();
    
    // Update message limit status
    await MessageLimit.findOneAndUpdate(
      { userId },
      { subscriptionStatus: "premium" },
      { upsert: true }
    );
    
    res.json({ success: true, subscription });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get subscription plans
export const getSubscriptionPlans: RequestHandler = async (req, res) => {
  try {
    const plans = [
      {
        id: "individual",
        name: "Individual Chat",
        description: "Unlimited messages with one specific person",
        price: 5.99,
        currency: "USD",
        duration: "30 days"
      },
      {
        id: "unlimited",
        name: "Unlimited Access",
        description: "Unlimited messages with all alumni",
        price: 19.99,
        currency: "USD",
        duration: "30 days"
      }
    ];
    
    res.json({ plans });
  } catch (error) {
    console.error("Error getting subscription plans:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
