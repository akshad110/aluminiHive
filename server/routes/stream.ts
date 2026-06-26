import { RequestHandler } from "express";
import { StreamClient } from "@stream-io/node-sdk";

function getStreamClient(): StreamClient {
  const apiKey = process.env.STREAM_API_KEY;
  const secret = process.env.STREAM_API_SECRET;

  if (!apiKey || !secret) {
    throw new Error("Stream API credentials are not configured");
  }

  return new StreamClient(apiKey, secret);
}

export const generateStreamToken: RequestHandler = async (req, res) => {
  try {
    const { userId, userName } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const client = getStreamClient();

    await client.upsertUsers([
      {
        id: String(userId),
        name: userName || String(userId),
        role: "user",
      },
    ]);

    const token = client.generateUserToken({
      user_id: String(userId),
      validity_in_seconds: 60 * 60,
    });

    res.json({ token });
  } catch (error) {
    console.error("Error generating Stream token:", error);
    res.status(500).json({ error: "Failed to generate Stream token" });
  }
};
