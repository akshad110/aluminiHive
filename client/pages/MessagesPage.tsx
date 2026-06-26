import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MessageCircle, 
  Search, 
  Plus,
  ArrowLeft,
  Clock
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Conversation {
  _id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  lastMessage: {
    content: string;
    createdAt: string;
    messageType: string;
  };
  unreadCount: number;
}

export default function MessagesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/messages/conversations/${user?._id}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (otherUserId: string) => {
    navigate(`/messages/${otherUserId}`);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    `${conv.firstName} ${conv.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading conversations...</p>
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
          <div>
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground">
              Connect with alumni and students
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Conversations List */}
        {filteredConversations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
              <p className="text-muted-foreground mb-4">
                Start a conversation by visiting an alumni profile
              </p>
              <Button onClick={() => navigate("/batches")}>
                <Plus className="h-4 w-4 mr-2" />
                Browse Alumni
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conversation) => (
              <Card 
                key={conversation._id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleConversationClick(conversation._id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conversation.profilePicture} />
                      <AvatarFallback>
                        {conversation.firstName[0]}{conversation.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate">
                          {conversation.firstName} {conversation.lastName}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(conversation.lastMessage.createdAt)}
                          </span>
                          {conversation.unreadCount > 0 && (
                            <Badge className="bg-blue-600 text-white">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage.content}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
