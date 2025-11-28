import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import MessageLimitIndicator from "./MessageLimitIndicator";
import { 
  Send, 
  MessageCircle,
  Users,
  Calendar,
  MapPin,
  ArrowLeft,
  Smile,
  Paperclip,
  Image,
  File,
  X
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  createdAt: string;
  messageType: string;
}

interface Batch {
  _id: string;
  name: string;
  college: string;
  graduationYear: number;
  members: any[];
  totalMembers?: number;
}

interface EmbeddedChatProps {
  chatId: string;
  type: "batch" | "personal";
  onBack?: () => void;
}

export default function EmbeddedChat({ chatId, type, onBack }: EmbeddedChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [batchInfo, setBatchInfo] = useState<Batch | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [actualUserId, setActualUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (type === "batch") {
      fetchBatchChat();
    } else {
      fetchPersonalChat();
    }
  }, [chatId, type]);

  const fetchBatchChat = async () => {
    try {
      setLoading(true);
      
      // Fetch batch info
      const batchResponse = await fetch(`/api/batches/${chatId}`);
      if (batchResponse.ok) {
        const batchData = await batchResponse.json();
        setBatchInfo(batchData.batch || batchData);
      }

      // Fetch messages
      const messagesResponse = await fetch(`/api/batches/${chatId}/chat/messages?userId=${user?._id}`);
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        setMessages(messagesData.messages || []);
      }
    } catch (error) {
      console.error("Error fetching batch chat:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonalChat = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching personal chat for:", { chatId, userId: user?._id });
      
      // First try to get user info directly since chatId might be a User ID
      const userResponse = await fetch(`/api/users/${chatId}`);
      console.log("👤 User response status:", userResponse.status);
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log("👤 User data:", userData);
        setOtherUser(userData.user);
        setActualUserId(chatId);
        console.log("🆔 Using chatId as user ID for messages:", chatId);
        
        // Fetch messages using the chatId as user ID
        const messagesResponse = await fetch(`/api/messages/${user?._id}/${chatId}`);
        console.log("📨 Messages response status:", messagesResponse.status);
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          console.log("💬 Messages data:", messagesData);
          setMessages(messagesData.messages || []);
        } else {
          const errorText = await messagesResponse.text();
          console.error("❌ Failed to fetch messages:", messagesResponse.status, errorText);
        }
      } else {
        // If user fetch fails, try alumni fetch
        console.log("👤 User fetch failed, trying alumni fetch...");
        const alumniResponse = await fetch(`/api/alumni/${chatId}`);
        console.log("📡 Alumni response status:", alumniResponse.status);
        if (alumniResponse.ok) {
          const alumniData = await alumniResponse.json();
          console.log("👤 Alumni data:", alumniData);
          console.log("👤 Alumni data structure:", JSON.stringify(alumniData, null, 2));
          
          // Set the other user data (populated userId contains the user info)
          setOtherUser(alumniData.userId);
          
          // Use the actual user ID for fetching messages
          const userId = alumniData.userId?._id || alumniData.userId;
          if (!userId) {
            console.error("❌ No user ID found in alumni data");
            return;
          }
          setActualUserId(userId);
          console.log("🆔 Using user ID for messages:", userId);
          
          // Fetch messages using the actual user ID
          const messagesResponse = await fetch(`/api/messages/${user?._id}/${userId}`);
          console.log("📨 Messages response status:", messagesResponse.status);
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            console.log("💬 Messages data:", messagesData);
            setMessages(messagesData.messages || []);
          } else {
            const errorText = await messagesResponse.text();
            console.error("❌ Failed to fetch messages:", messagesResponse.status, errorText);
          }
        } else {
          const errorText = await alumniResponse.text();
          console.error("❌ Failed to fetch alumni data:", alumniResponse.status, errorText);
        }
      }
    } catch (error) {
      console.error("❌ Error fetching personal chat:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !user?._id) return;

    setSending(true);
    try {
      const response = await fetch(
        type === "batch" 
          ? `/api/batches/${chatId}/chat/messages`
          : `/api/messages/${user._id}/${actualUserId || chatId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: newMessage,
            messageType: "text"
          }),
        }
      );

      if (response.ok) {
        setNewMessage("");
        // Refresh messages
        if (type === "batch") {
          fetchBatchChat();
        } else {
          fetchPersonalChat();
        }
      } else if (response.status === 429) {
        // Message limit reached
        const errorData = await response.json();
        alert(errorData.message || "Daily message limit reached. Please upgrade to continue messaging.");
        // Refresh message limit indicator
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendFileMessage = async () => {
    if (!selectedFile || !user?._id) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      console.log("📤 Sending file:", selectedFile.name, "to:", type === "batch" ? `/api/batches/${chatId}/chat/messages/file` : `/api/messages/${user._id}/${actualUserId || chatId}/file`);

      const response = await fetch(
        type === "batch" 
          ? `/api/batches/${chatId}/chat/messages/file`
          : `/api/messages/${user._id}/${actualUserId || chatId}/file`,
        {
          method: "POST",
          body: formData,
        }
      );

      console.log("📤 File upload response:", response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log("✅ File uploaded successfully:", result);
        removeFile();
        // Refresh messages
        if (type === "batch") {
          fetchBatchChat();
        } else {
          fetchPersonalChat();
        }
      } else {
        const error = await response.text();
        console.error("❌ File upload failed:", error);
        try {
          const errorData = JSON.parse(error);
          alert(`Failed to upload file: ${errorData.error || 'Unknown error'}`);
        } catch {
          alert(`Failed to upload file: ${error}`);
        }
      }
    } catch (error) {
      console.error("Error sending file:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setUploadingFile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-white border-b p-3 sm:p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-1 sm:p-2 flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
              <AvatarImage src={type === "batch" ? undefined : otherUser?.profilePicture} />
              <AvatarFallback>
                {type === "batch" 
                  ? batchInfo?.name?.charAt(0) || "B"
                  : otherUser?.firstName?.charAt(0) || "U"
                }
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                {type === "batch" 
                  ? batchInfo?.name 
                  : otherUser 
                    ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || 'Unknown User'
                    : 'Loading...'
                }
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                {type === "batch" ? "Batch Group Chat" : "Personal Chat"}
              </p>
            </div>
          </div>
        </div>
        
        {type === "batch" && batchInfo && (
          <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-500 flex-shrink-0">
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{batchInfo.members?.length || batchInfo.totalMembers || 0} members</span>
            <span className="sm:hidden">{batchInfo.members?.length || batchInfo.totalMembers || 0}</span>
          </div>
        )}
      </div>

      {/* Message Limit Indicator for Students */}
      {user?.role === "student" && type === "personal" && (
        <MessageLimitIndicator
          userId={user._id}
          targetUserId={actualUserId || chatId}
          targetUserName={otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : undefined}
        />
      )}

      {/* Batch Members Section for Students */}
      {user?.role === "student" && type === "batch" && batchInfo && batchInfo.members && (
        <div className="bg-white border-b p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Alumni Members - Click to Message</h3>
          <div className="flex flex-wrap gap-2">
            {batchInfo.members
              .filter((member: any) => member.role === "alumni")
              .map((alumni: any) => (
                <button
                  key={alumni._id}
                  onClick={() => {
                    // Navigate to personal chat with this alumni within the unified chat
                    const event = new CustomEvent('selectPersonalChat', { 
                      detail: { chatId: alumni._id, type: 'personal' } 
                    });
                    window.dispatchEvent(event);
                  }}
                  className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={alumni.profilePicture} />
                    <AvatarFallback className="text-xs">
                      {alumni.firstName?.charAt(0) || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {alumni.firstName} {alumni.lastName}
                    </p>
                    <p className="text-xs text-gray-500">Alumni</p>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-6 sm:py-8">
            <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
            <p className="text-sm sm:text-base">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`flex ${message.sender?._id === user?._id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 rounded-lg ${
                  message.sender?._id === user?._id
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-900"
                }`}
              >
                {message.messageType === 'file' ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {message.content.includes('image') ? (
                        <Image className="w-4 h-4" />
                      ) : (
                        <File className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">File</span>
                    </div>
                    <p className="text-sm break-all">{message.content}</p>
                    <a 
                      href={`/api/files/${message.content}`} 
                      download
                      className="text-xs underline hover:no-underline"
                    >
                      Download File
                    </a>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
                <p className={`text-xs mt-1 ${
                  message.sender?._id === user?._id ? "text-blue-100" : "text-gray-500"
                }`}>
                  {new Date(message.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File Preview */}
      {selectedFile && (
        <div className="bg-gray-100 border-t p-4">
          <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
            <div className="flex items-center space-x-3">
              {filePreview ? (
                <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded" />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                  <File className="w-6 h-6 text-gray-500" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={sendFileMessage}
                disabled={uploadingFile}
                size="sm"
                className="bg-blue-500 hover:bg-blue-600"
              >
                {uploadingFile ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
              <Button
                onClick={removeFile}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Message Input */}
      {user?.role === "student" && type === "batch" ? (
        <div className="bg-gray-100 border-t p-3 sm:p-4">
          <div className="text-center text-gray-500 py-3 sm:py-4">
            <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-xs sm:text-sm">You can only view messages as a student</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border-t p-3 sm:p-4">
          <div className="flex space-x-1 sm:space-x-2">
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="pr-16 sm:pr-20 text-sm h-9 sm:h-10"
                disabled={sending}
              />
              <div className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 flex space-x-0.5 sm:space-x-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-1 h-7 w-7 sm:h-6 sm:w-6"
                >
                  <Smile className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1 h-7 w-7 sm:h-6 sm:w-6"
                >
                  <Paperclip className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 h-9 w-9 sm:h-10 sm:w-10 p-0"
            >
              <Send className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,application/pdf,.doc,.docx,.txt"
          />
          
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-20 right-4 z-10">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width={300}
                height={400}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
