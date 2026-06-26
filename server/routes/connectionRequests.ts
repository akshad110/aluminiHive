import { RequestHandler } from "express";
import mongoose from "mongoose";
import { ConnectionRequest, User } from "../models";

// Send connection request
export const sendConnectionRequest: RequestHandler = async (req, res) => {
  try {
    const { requesterId, recipientId } = req.params;
    const { message } = req.body;

    // Validate users exist
    const [requester, recipient] = await Promise.all([
      User.findById(requesterId),
      User.findById(recipientId)
    ]);

    if (!requester || !recipient) {
      return res.status(404).json({ error: "One or both users not found" });
    }

    // Check if request already exists
    const existingRequest = await ConnectionRequest.findOne({
      requester: requesterId,
      recipient: recipientId
    });

    if (existingRequest) {
      return res.status(400).json({ 
        error: "Connection request already exists",
        status: existingRequest.status
      });
    }

    // Create new connection request
    const connectionRequest = new ConnectionRequest({
      requester: requesterId,
      recipient: recipientId,
      message: message || "",
    });

    await connectionRequest.save();

    res.status(201).json({
      message: "Connection request sent successfully",
      data: connectionRequest,
    });
  } catch (error) {
    console.error("Error sending connection request:", error);
    res.status(500).json({ error: "Failed to send connection request" });
  }
};

// Get connection requests for a user
export const getConnectionRequests: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type = "received" } = req.query; // "sent" or "received"

    let query: any = {};
    if (type === "sent") {
      query.requester = userId;
    } else {
      query.recipient = userId;
    }

    const requests = await ConnectionRequest.find(query)
      .populate("requester", "firstName lastName profilePicture email")
      .populate("recipient", "firstName lastName profilePicture email")
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error("Error fetching connection requests:", error);
    res.status(500).json({ error: "Failed to fetch connection requests" });
  }
};

// Update connection request status
export const updateConnectionRequest: RequestHandler = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be 'accepted' or 'rejected'" });
    }

    const request = await ConnectionRequest.findByIdAndUpdate(
      requestId,
      { status },
      { new: true }
    ).populate("requester", "firstName lastName profilePicture email")
     .populate("recipient", "firstName lastName profilePicture email");

    if (!request) {
      return res.status(404).json({ error: "Connection request not found" });
    }

    res.json({
      message: "Connection request updated successfully",
      data: request,
    });
  } catch (error) {
    console.error("Error updating connection request:", error);
    res.status(500).json({ error: "Failed to update connection request" });
  }
};

// Check connection status between two users
export const checkConnectionStatus: RequestHandler = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;

    const request = await ConnectionRequest.findOne({
      $or: [
        { requester: userId1, recipient: userId2 },
        { requester: userId2, recipient: userId1 }
      ]
    });

    if (!request) {
      return res.json({ status: "none" });
    }

    res.json({ status: request.status });
  } catch (error) {
    console.error("Error checking connection status:", error);
    res.status(500).json({ error: "Failed to check connection status" });
  }
};

export const getConnectionStats: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get accepted connections (both sent and received)
    const acceptedConnections = await ConnectionRequest.find({
      $or: [
        { requester: userId, status: "accepted" },
        { recipient: userId, status: "accepted" }
      ]
    });

    // Get pending requests received by this user
    const pendingReceived = await ConnectionRequest.find({
      recipient: userId,
      status: "pending"
    });

    // Get pending requests sent by this user
    const pendingSent = await ConnectionRequest.find({
      requester: userId,
      status: "pending"
    });

    // Get all requests received by this user (for total count)
    const allReceived = await ConnectionRequest.find({
      recipient: userId
    });

    const stats = {
      totalConnections: acceptedConnections.length,
      pendingRequests: pendingReceived.length,
      sentRequests: pendingSent.length,
      receivedRequests: allReceived.length
    };

    res.json({ stats });
  } catch (error) {
    console.error("Get connection stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
