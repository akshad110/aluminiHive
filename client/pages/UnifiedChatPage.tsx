import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageCircle, 
  Search, 
  Plus, 
  MoreVertical, 
  Users, 
  User,
  Clock,
  Check,
  CheckCheck
} from "lucide-react";

interface ChatItem {
  id: string;
  type: "batch" | "personal";
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  avatar?: string;
  isOnline?: boolean;
  batchInfo?: {
    college: string;
    graduationYear: number;
    memberCount: number;
  };
  personalInfo?: {
    userId: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface UnifiedChatPageProps {
  onChatSelect?: (chatId: string, type: "batch" | "personal") => void;
}

export default function UnifiedChatPage({ onChatSelect }: UnifiedChatPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "unread" | "batches" | "personal">("all");
  const [exploreOtherColleges, setExploreOtherColleges] = useState(() => {
    // Load from localStorage on initialization
    const saved = localStorage.getItem('exploreOtherColleges');
    return saved === 'true';
  });
  const [userCollege, setUserCollege] = useState<string>("");

  useEffect(() => {
    console.log("🔄 useEffect triggered, user:", user);
    if (user) {
      console.log("✅ User found, calling fetchUserCollege and fetchChats");
      fetchUserCollege();
      fetchChats();
    } else {
      console.log("❌ No user found");
    }
  }, [user]);

  const fetchUserCollege = async () => {
    try {
      if (user?.role === "student") {
        // For students, get college from User model via getProfile endpoint
        const response = await fetch(`/api/auth/profile/${user._id}`);
        if (response.ok) {
          const userData = await response.json();
          setUserCollege(userData.user?.college || "");
        }
      } else if (user?.role === "alumni") {
        const response = await fetch(`/api/alumni/${user._id}`);
        if (response.ok) {
          const alumniData = await response.json();
          // Get college from education field
          const college = alumniData.education?.[0]?.institution || "";
          setUserCollege(college);
        }
      }
    } catch (error) {
      console.error("Error fetching user college:", error);
    }
  };

  const fetchChats = async () => {
    try {
      setLoading(true);
      console.log("🔄 Starting to fetch chats...");
      
      const chatItems: ChatItem[] = [];
      
      // Fetch batch chats
      try {
        console.log("📦 Fetching batch chats...");
        const batchResponse = await fetch("/api/batches");
        if (batchResponse.ok) {
          const batchData = await batchResponse.json();
          console.log("📦 Batch data received:", batchData);
          
          if (batchData.batches && Array.isArray(batchData.batches)) {
            console.log(`📦 Processing ${batchData.batches.length} batches...`);
            
            // Filter batches based on user role and college
            let filteredBatches = batchData.batches;
            
            if (user?.role === "alumni" || user?.role === "student") {
              // Both alumni and students can toggle between same college and all colleges
              if (!exploreOtherColleges) {
                filteredBatches = batchData.batches.filter((batch: any) => 
                  batch.college === userCollege
                );
                console.log(`📦 Filtered to ${filteredBatches.length} batches from user's college (${userCollege})`);
              } else {
                console.log(`📦 Showing all ${filteredBatches.length} batches (explore other colleges enabled)`);
              }
            }
            
            for (const batch of filteredBatches) {
              // Get last message for this batch
              try {
                const lastMessageResponse = await fetch(`/api/batches/${batch._id}/chat/messages?userId=${user?._id}&limit=1`);
                if (lastMessageResponse.ok) {
                  const lastMessageData = await lastMessageResponse.json();
                  
                  chatItems.push({
                    id: batch._id,
                    type: "batch" as const,
                    name: batch.name,
                    lastMessage: lastMessageData.messages?.[0]?.content || "No messages yet",
                    timestamp: lastMessageData.messages?.[0]?.createdAt || batch.updatedAt,
                    unreadCount: 0, // You can implement unread count logic
                    batchInfo: {
                      college: batch.college,
                      graduationYear: batch.graduationYear,
                      memberCount: batch.totalMembers || 0
                    }
                  });
                } else {
                  // Add batch without last message if API fails
                  chatItems.push({
                    id: batch._id,
                    type: "batch" as const,
                    name: batch.name,
                    lastMessage: "No messages yet",
                    timestamp: batch.updatedAt,
                    unreadCount: 0,
                    batchInfo: {
                      college: batch.college,
                      graduationYear: batch.graduationYear,
                      memberCount: batch.totalMembers || 0
                    }
                  });
                }
              } catch (error) {
                console.error("Error fetching last message for batch:", error);
                // Add batch without last message if API fails
                chatItems.push({
                  id: batch._id,
                  type: "batch" as const,
                  name: batch.name,
                  lastMessage: "No messages yet",
                  timestamp: batch.updatedAt,
                  unreadCount: 0,
                  batchInfo: {
                    college: batch.college,
                    graduationYear: batch.graduationYear,
                    memberCount: batch.totalMembers || 0
                  }
                });
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching batch chats:", error);
      }
      
      // Fetch personal conversations
      try {
        console.log("🔍 Fetching personal conversations for user:", user?._id);
        console.log("🔍 User role:", user?.role);
        const personalResponse = await fetch(`/api/messages/conversations/${user?._id}`);
        console.log("📨 Personal conversations response:", personalResponse.status);
        if (personalResponse.ok) {
          const personalData = await personalResponse.json();
          console.log("💬 Personal conversations data:", personalData);
          
          if (personalData.conversations && Array.isArray(personalData.conversations)) {
            console.log("📋 Found", personalData.conversations.length, "personal conversations");
            for (const conversation of personalData.conversations) {
              if (conversation.otherUser?._id) {
                const chatItem: ChatItem = {
                  id: conversation.otherUser._id,
                  type: "personal" as const,
                  name: `${conversation.otherUser.firstName || ''} ${conversation.otherUser.lastName || ''}`,
                  lastMessage: conversation.lastMessage?.content || "No messages yet",
                  timestamp: conversation.lastMessage?.createdAt || conversation.updatedAt,
                  unreadCount: conversation.unreadCount || 0,
                  personalInfo: {
                    userId: conversation.otherUser._id,
                    firstName: conversation.otherUser.firstName,
                    lastName: conversation.otherUser.lastName,
                    role: conversation.otherUser.role
                  }
                };
                console.log("➕ Adding personal chat item:", chatItem);
                chatItems.push(chatItem);
              }
            }
          } else {
            console.log("❌ No conversations found or invalid format");
          }
        } else {
          console.error("❌ Failed to fetch personal conversations:", personalResponse.status);
        }
      } catch (error) {
        console.error("❌ Error fetching personal conversations:", error);
        console.error("❌ Error details:", error);
      }
      
      // Sort by timestamp (most recent first)
      chatItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      console.log("✅ Final chat items:", chatItems);
      console.log("📊 Total chats found:", chatItems.length);
      console.log("📊 Personal chats:", chatItems.filter(chat => chat.type === "personal").length);
      console.log("📊 Batch chats:", chatItems.filter(chat => chat.type === "batch").length);
      setChats(chatItems);
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = (chat: ChatItem) => {
    // Always use onChatSelect if available (unified chat mode)
    if (onChatSelect) {
      onChatSelect(chat.id, chat.type);
    } else {
      // Fallback to navigation only if onChatSelect is not provided
      if (chat.type === "batch") {
        navigate(`/batches/${chat.id}/chat`);
      } else {
        navigate(`/messages/${chat.id}`);
      }
    }
  };

  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chat.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
    
    switch (selectedFilter) {
      case "unread":
        return matchesSearch && chat.unreadCount > 0;
      case "batches":
        return matchesSearch && chat.type === "batch";
      case "personal":
        return matchesSearch && chat.type === "personal";
      default:
        return matchesSearch;
    }
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading chats...</p>
        </div>
      </div>
    );
  }

  console.log("🔍 UnifiedChatPage render - chats:", chats.length, "loading:", loading);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b bg-white">
        {/* Title and Action Buttons Row */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h1 className="text-lg sm:text-xl font-semibold">Chats</h1>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button size="sm" variant="outline" className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">New</span>
            </Button>
            <Button size="sm" variant="outline" className="h-8 w-8 sm:h-9 sm:w-9">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Toggle Button Row - Full Width for Better Visibility */}
        {(user?.role === "student" || user?.role === "alumni") && (
          <div className="mb-3 sm:mb-4">
            <Button 
              size="sm" 
              variant={exploreOtherColleges ? "default" : "outline"}
              onClick={() => {
                const newState = !exploreOtherColleges;
                setExploreOtherColleges(newState);
                localStorage.setItem('exploreOtherColleges', newState.toString());
                fetchChats(); // Refetch chats with new filter
              }}
              className="w-full sm:w-auto h-9 px-4 text-sm font-medium"
            >
              {exploreOtherColleges ? "Same College Only" : "Explore Other Colleges"}
            </Button>
          </div>
        )}
        
        
        {/* Search */}
        <div className="relative mb-3 sm:mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9 sm:h-10 text-sm"
          />
        </div>
        
        {/* Filters */}
        <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { key: "all", label: "All" },
            { key: "unread", label: "Unread" },
            { key: "batches", label: "Batches" },
            { key: "personal", label: "Personal" }
          ].map((filter) => (
            <Button
              key={filter.key}
              size="sm"
              variant={selectedFilter === filter.key ? "default" : "outline"}
              onClick={() => setSelectedFilter(filter.key as any)}
              className="text-xs sm:text-sm whitespace-nowrap h-8 sm:h-9 px-3 sm:px-4 flex-shrink-0"
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No chats found</p>
            <p className="text-sm">Start a conversation or join a batch chat</p>
            <div className="mt-4 text-xs text-gray-400">
              <p>Total chats: {chats.length}</p>
              <p>Filtered chats: {filteredChats.length}</p>
              <p>Search term: "{searchTerm}"</p>
              <p>Filter: {selectedFilter}</p>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {filteredChats.map((chat) => (
              <div
                key={`${chat.type}-${chat.id}`}
                className="p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors active:bg-gray-100"
                onClick={() => handleChatClick(chat)}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                      <AvatarImage src={chat.avatar} />
                      <AvatarFallback className="bg-blue-100">
                        {chat.type === "batch" ? (
                          <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                        ) : (
                          <User className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    {chat.isOnline && (
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-sm sm:text-base truncate">{chat.name}</h3>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(chat.timestamp)}
                        </span>
                        {chat.unreadCount > 0 && (
                          <Badge className="bg-blue-600 text-white text-xs h-5 w-5 flex items-center justify-center p-0">
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate flex-1 mr-2">
                        {chat.lastMessage}
                      </p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {chat.type === "personal" && (
                          <CheckCheck className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                        )}
                      </div>
                    </div>
                    
                    {chat.batchInfo && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-2">
                        <Badge variant="outline" className="text-xs px-2 py-1 w-fit">
                          <span className="hidden sm:inline">{chat.batchInfo.college} • {chat.batchInfo.graduationYear}</span>
                          <span className="sm:hidden">{chat.batchInfo.college}</span>
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span className="hidden sm:inline">{chat.batchInfo.memberCount} members</span>
                          <span className="sm:hidden">{chat.batchInfo.memberCount} members</span>
                        </div>
                      </div>
                    )}
                    
                    {chat.personalInfo && (
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-2 py-1 ${
                            chat.personalInfo.role === "alumni" 
                              ? "border-blue-200 text-blue-600" 
                              : "border-green-200 text-green-600"
                          }`}
                        >
                          {chat.personalInfo.role}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
