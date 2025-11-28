import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Crown, AlertCircle } from "lucide-react";
import SubscriptionModal from "./SubscriptionModal";

interface MessageLimitData {
  hasSubscription: boolean;
  messageCount: number;
  remainingMessages: number;
  requiresSubscription: boolean;
  subscription?: {
    type: string;
    endDate: string;
  };
  alumniId?: string;
  alumniName?: string;
}

interface MessageLimitIndicatorProps {
  userId: string;
  targetUserId?: string;
  targetUserName?: string;
  onMessageLimitReached?: () => void;
}

export default function MessageLimitIndicator({ 
  userId, 
  targetUserId, 
  targetUserName,
  onMessageLimitReached 
}: MessageLimitIndicatorProps) {
  const [limitData, setLimitData] = useState<MessageLimitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  useEffect(() => {
    fetchMessageLimit();
  }, [userId, targetUserId]);

  const fetchMessageLimit = async () => {
    if (!targetUserId) return;
    
    try {
      const response = await fetch(`/api/subscriptions/status/${userId}/${targetUserId}`);
      if (response.ok) {
        const data = await response.json();
        setLimitData(data);
      }
    } catch (error) {
      console.error("Error fetching message limit:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string, targetUserId?: string) => {
    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          targetUserId,
          subscriptionType: planId,
          amount: planId === "individual" ? 5.99 : 19.99,
          paymentId: `mock_payment_${Date.now()}`, // Mock payment ID
        }),
      });

      if (response.ok) {
        // Refresh message limit data
        await fetchMessageLimit();
        alert("Subscription activated successfully! You now have unlimited messaging.");
      } else {
        alert("Failed to activate subscription. Please try again.");
      }
    } catch (error) {
      console.error("Error creating subscription:", error);
      alert("Error creating subscription. Please try again.");
    }
  };

  if (loading) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!limitData) {
    return null;
  }

  const isLimitReached = !limitData.hasSubscription && limitData.requiresSubscription;
  const isNearLimit = !limitData.hasSubscription && limitData.remainingMessages <= 2 && limitData.remainingMessages > 0;

  return (
    <>
      <Card className={`mb-4 ${isLimitReached ? "border-red-200 bg-red-50" : isNearLimit ? "border-yellow-200 bg-yellow-50" : "border-blue-200 bg-blue-50"}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {limitData.hasSubscription ? (
                <Crown className="w-5 h-5 text-yellow-500" />
              ) : (
                <MessageCircle className="w-5 h-5 text-blue-500" />
              )}
              
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">
                    {limitData.hasSubscription ? "Unlimited Messaging" : `Messages with ${targetUserName || "this alumni"}`}
                  </span>
                  {limitData.hasSubscription && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Subscribed
                    </Badge>
                  )}
                </div>
                
                {!limitData.hasSubscription && (
                  <p className="text-sm text-gray-600">
                    {limitData.remainingMessages === -1 ? "Unlimited messages" : `${limitData.remainingMessages} messages remaining`}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {!limitData.hasSubscription && (
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {limitData.messageCount}/5
                  </div>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        isLimitReached ? "bg-red-500" : 
                        isNearLimit ? "bg-yellow-500" : "bg-blue-500"
                      }`}
                      style={{ width: `${(limitData.messageCount / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {!limitData.hasSubscription && (
                <Button
                  size="sm"
                  onClick={() => setShowSubscriptionModal(true)}
                  className={isLimitReached ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"}
                >
                  {isLimitReached ? "Subscribe Now" : "Subscribe"}
                </Button>
              )}
            </div>
          </div>

          {isLimitReached && (
            <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">
                  You've reached your limit of 5 messages with this alumni. Subscribe to continue messaging!
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        targetUserId={targetUserId}
        targetUserName={targetUserName}
        onSubscribe={handleSubscribe}
      />
    </>
  );
}
