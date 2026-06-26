import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Send, 
  MessageCircle,
  User
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  _id: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  receiver: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  content: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
}

interface OtherUser {
  _id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
}

export default function ConversationPage() {
  const { otherUserId } = useParams<{ otherUserId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (otherUserId && user) {
      fetchConversation();
      fetchOtherUser();
    }
  }, [otherUserId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/messages/${user?._id}/${otherUserId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOtherUser = async () => {
    try {
      const response = await fetch(`/api/users/${otherUserId}`);
      if (response.ok) {
        const data = await response.json();
        setOtherUser(data);
      } else {
        console.error("Failed to fetch other user:", response.status);
        setOtherUser(null);
      }
    } catch (error) {
      console.error("Error fetching other user:", error);
      setOtherUser(null);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const response = await fetch(`/api/messages/${user?._id}/${otherUserId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          messageType: "text",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.data]);
        setNewMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser?.profilePicture} />
              <AvatarFallback>
                {otherUser && otherUser.firstName && otherUser.lastName 
                  ? `${otherUser.firstName[0]}${otherUser.lastName[0]}` 
                  : <User className="h-4 w-4" />
                }
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-semibold">
                {otherUser && otherUser.firstName && otherUser.lastName 
                  ? `${otherUser.firstName} ${otherUser.lastName}` 
                  : "Loading..."
                }
              </h1>
              <p className="text-sm text-muted-foreground">Online</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <Card className="h-96">
          <CardContent className="p-4 h-full overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message._id}
                    className={`flex ${message.sender._id === user?._id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender._id === user?._id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender._id === user?._id
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}>
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Input */}
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sending}
          />
          <Button type="submit" disabled={sending || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
