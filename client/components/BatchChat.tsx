import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Send, 
  Smile, 
  Paperclip, 
  MoreVertical, 
  Reply, 
  Edit, 
  Trash2,
  Check,
  CheckCheck,
  RefreshCw,
  Users,
  LogOut,
  Settings,
  Info,
  MessageSquare
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Global flag to prevent multiple instances
const activeChats = new Set<string>();

interface ChatMessage {
  _id: string;
  batchId: string;
  senderId: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  messageType: "text" | "image" | "file" | "system";
  content: string;
  mediaUrl?: string;
  fileName?: string;
  reactions: {
    emoji: string;
    userId: {
      _id: string;
      firstName: string;
      lastName: string;
    };
    timestamp: string;
  }[];
  replies: {
    messageId: string;
    content: string;
    senderId: {
      _id: string;
      firstName: string;
      lastName: string;
    };
    timestamp: string;
  }[];
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  readBy: {
    userId: string;
    readAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface BatchChatProps {
  batchId: string;
  batchName: string;
  onShowMembers?: () => void;
  onLeaveBatch?: () => void;
}

export default function BatchChat({ batchId, batchName, onShowMembers, onLeaveBatch }: BatchChatProps) {
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [showBatchInfo, setShowBatchInfo] = useState(false);
  const [chatSettings, setChatSettings] = useState(null);
  const [batchDetails, setBatchDetails] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Fetch chat settings
  const fetchChatSettings = async () => {
    if (!user?._id) return;
    
    setSettingsLoading(true);
    try {
      const response = await fetch(`/api/batches/${batchId}/chat/settings?userId=${user._id}`);
      if (response.ok) {
        const data = await response.json();
        setChatSettings(data);
      }
    } catch (error) {
      console.error("Error fetching chat settings:", error);
    }
    setSettingsLoading(false);
  };

  // Fetch batch details
  const fetchBatchDetails = async () => {
    if (!user?._id) return;
    
    setDetailsLoading(true);
    try {
      const response = await fetch(`/api/batches/${batchId}/details?userId=${user._id}`);
      if (response.ok) {
        const data = await response.json();
        setBatchDetails(data);
      }
    } catch (error) {
      console.error("Error fetching batch details:", error);
    }
    setDetailsLoading(false);
  };

  // Handle chat settings click
  const handleChatSettingsClick = () => {
    setShowChatSettings(true);
    fetchChatSettings();
  };

  // Handle batch info click
  const handleBatchInfoClick = () => {
    setShowBatchInfo(true);
    fetchBatchDetails();
  };
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isLoadingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  const fetchCountRef = useRef<number>(0);
  const isMountedRef = useRef(true);

  

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Fetch messages
  const fetchMessages = async (showLoading = true, force = false) => {
    if (!user?._id) {
      console.log("❌ No user ID available for fetching messages");
      return;
    }
    
    // Prevent multiple simultaneous requests
    if (isLoadingRef.current) {
      console.log("⏳ Already loading messages, skipping...");
      return;
    }
    
    // Check if component is still mounted
    if (!isMountedRef.current) {
      console.log("⏳ Component unmounted, skipping fetch...");
      return;
    }
    
    // AGGRESSIVE THROTTLING - Only allow fetches when absolutely necessary
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    const minInterval = 30000; // 30 seconds minimum between fetches
    
    if (!force && timeSinceLastFetch < minInterval) {
      console.log("⏳ Too soon since last fetch, skipping...", { 
        timeSinceLastFetch, 
        minInterval,
        fetchCount: fetchCountRef.current 
      });
      return;
    }
    
    // Limit total fetch count per session to 5
    if (!force && fetchCountRef.current > 5) {
      console.log("⏳ Maximum fetch limit reached, stopping...", { fetchCount: fetchCountRef.current });
      return;
    }
    
    try {
      isLoadingRef.current = true;
      lastFetchTimeRef.current = now;
      fetchCountRef.current += 1;
      
      if (showLoading) {
        setLoading(true);
      }
      console.log("🔄 Fetching messages for batch:", batchId, "user:", user._id, "count:", fetchCountRef.current);
      
      const response = await fetch(`/api/batches/${batchId}/chat/messages?userId=${user._id}`);

      if (response.ok) {
        const data = await response.json();
        console.log("📥 Messages fetched:", data);
        setMessages(data.messages || []);
      } else {
        console.error("❌ Failed to fetch messages:", response.status, response.statusText);
        const errorData = await response.json();
        console.error("❌ Error details:", errorData);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      isLoadingRef.current = false;
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const chatKey = `${batchId}-${user?._id}`;
    
    if (batchId && user?._id && !hasInitializedRef.current && isMountedRef.current && !activeChats.has(chatKey)) {
      hasInitializedRef.current = true;
      activeChats.add(chatKey);
      console.log("🚀 Initializing chat for batch:", batchId, "user:", user._id);
      
      // Only fetch once on initialization
      fetchMessages(true, true);
    }
    
    return () => {
      isMountedRef.current = false;
      activeChats.delete(chatKey);
    };
  }, [batchId, user?._id]);

  // Separate effect for cleanup
  useEffect(() => {
    return () => {
      hasInitializedRef.current = false;
      fetchCountRef.current = 0;
      isMountedRef.current = false;
    };
  }, []);

  // Send message
  const sendMessage = async () => {
    if (!user?._id) {
      console.log("❌ No user ID available for sending message");
      return;
    }
    
    console.log("🔍 sendMessage called:", { newMessage, sending, user: user._id });
    
    // Get the current value from the input field as a backup
    const currentInputValue = inputRef.current?.value || "";
    console.log("🔍 Input ref value:", currentInputValue);
    
    // Use input value if newMessage state is empty
    const messageToSend = newMessage || currentInputValue;
    console.log("🔍 Message to send:", messageToSend);
    
    // Safety check for messageToSend
    if (!messageToSend || typeof messageToSend !== 'string') {
      console.log("❌ messageToSend is invalid:", { messageToSend, type: typeof messageToSend });
      return;
    }
    
    if (!messageToSend.trim() || sending) {
      console.log("❌ Early return:", { messageToSend, sending });
      return;
    }

    try {
      setSending(true);
      const requestBody = {
        userId: user._id,
        content: messageToSend.trim(),
        messageType: "text",
      };
      
      console.log("📤 Sending message:", requestBody);
      
      const response = await fetch(`/api/batches/${batchId}/chat/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        setNewMessage("");
        // Also clear the input field directly
        if (inputRef.current) {
          inputRef.current.value = "";
        }
        setReplyingTo(null);
        setEditingMessage(null);
        await fetchMessages(false, true); // Refresh messages without loading indicator, force it
      } else {
        const errorData = await response.json();
        console.error("❌ Send message failed:", errorData);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
    setSending(false);
  };

  // Add reaction
  const addReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/batches/chat/messages/${messageId}/reactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?._id,
          emoji,
        }),
      });

      if (response.ok) {
        await fetchMessages(); // Refresh messages
      }
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      const response = await fetch(`/api/batches/chat/messages/${messageId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user?._id }),
      });

      if (response.ok) {
        await fetchMessages(); // Refresh messages
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  // Edit message
  const editMessage = async (messageId: string, newContent: string) => {
    try {
      const response = await fetch(`/api/batches/chat/messages/${messageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?._id,
          content: newContent,
        }),
      });

      if (response.ok) {
        setEditingMessage(null);
        await fetchMessages(false, true); // Refresh messages without loading indicator, force it
      }
    } catch (error) {
      console.error("Error editing message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (editingMessage) {
        editMessage(editingMessage._id, newMessage);
      } else {
        sendMessage();
      }
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isMyMessage = (message: ChatMessage) => {
    return message.senderId._id === user?._id;
  };

  const getReadStatus = (message: ChatMessage) => {
    if (!isMyMessage(message)) return null;
    
    const readCount = message.readBy.length;
    const totalMembers = 10; // This should come from batch info
    
    if (readCount === totalMembers) {
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    } else if (readCount > 1) {
      return <Check className="h-3 w-3 text-gray-400" />;
    }
    return null;
  };

  // Emoji picker functionality
  const emojis = ['😀', '😂', '😍', '🥰', '😎', '🤔', '👍', '👎', '❤️', '🎉', '🔥', '💯', '👏', '🙌', '😊', '😢', '😮', '😡', '🤯', '🎯'];
  
  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  // File upload functionality
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !user?._id) return;

    try {
      setSending(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('userId', user._id);
      formData.append('batchId', batchId);
      formData.append('messageType', 'file');

      const response = await fetch(`/api/batches/${batchId}/chat/messages`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSelectedFile(null);
        removeSelectedFile();
        await fetchMessages(false, true);
      } else {
        const errorData = await response.json();
        console.error('File upload failed:', errorData);
        alert('Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    console.log("🔄 Showing loading state");
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading chat...</p>
        </div>
      </Card>
    );
  }

  // Reduced logging to prevent spam
  // console.log("🎨 Rendering chat interface:", { batchId, messagesCount: messages.length });

  return (
    <Card className="h-[600px] flex flex-col">
      {/* Chat Header */}
      <CardHeader className="pb-3 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {batchName.split(' ').map(word => word[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{batchName}</CardTitle>
              <p className="text-sm text-muted-foreground">Batch Group Chat</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => fetchMessages(false, true)}
              title="Refresh messages"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={onShowMembers}>
                  <Users className="h-4 w-4 mr-2" />
                  See Batch Members
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleChatSettingsClick}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBatchInfoClick}>
                  <Info className="h-4 w-4 mr-2" />
                  Batch Info
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onLeaveBatch}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Leave Batch
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {/* Messages Area - Fixed height with scroll */}
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea 
          className="h-full"
          ref={scrollAreaRef}
          onScrollCapture={() => {
            // Show scroll button when not at bottom
            const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollElement) {
              const { scrollTop, scrollHeight, clientHeight } = scrollElement;
              setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
            }
          }}
        >
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message._id}
                  className={`flex gap-3 ${isMyMessage(message) ? 'flex-row-reverse' : ''}`}
                >
                  {!isMyMessage(message) && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src={message.senderId.profilePicture} />
                      <AvatarFallback className="text-xs">
                        {getInitials(message.senderId.firstName, message.senderId.lastName)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`flex-1 max-w-[70%] ${isMyMessage(message) ? 'flex flex-col items-end' : ''}`}>
                    {!isMyMessage(message) && (
                      <p className="text-xs text-muted-foreground mb-1">
                        {message.senderId.firstName} {message.senderId.lastName}
                      </p>
                    )}
                    
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        isMyMessage(message)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.isDeleted ? (
                        <p className="italic text-muted-foreground">This message was deleted</p>
                      ) : (
                        <>
                          {message.messageType === 'file' ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Paperclip className="h-4 w-4" />
                                <span className="text-sm font-medium">{message.fileName}</span>
                              </div>
                              {message.mediaUrl && (
                                <a 
                                  href={message.mediaUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm underline hover:no-underline"
                                >
                                  Download File
                                </a>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm">{message.content}</p>
                          )}
                          {message.isEdited && (
                            <p className="text-xs opacity-70 mt-1">(edited)</p>
                          )}
                        </>
                      )}
                    </div>
                    
                    <div className={`flex items-center gap-2 mt-1 ${isMyMessage(message) ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(message.createdAt)}
                      </span>
                      {getReadStatus(message)}
                      
                      {/* Reactions */}
                      {message.reactions.length > 0 && (
                        <div className="flex gap-1">
                          {message.reactions.map((reaction, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs cursor-pointer hover:bg-gray-200"
                              onClick={() => addReaction(message._id, reaction.emoji)}
                            >
                              {reaction.emoji}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Message Actions */}
                    {!message.isDeleted && (
                      <div className={`flex gap-1 mt-1 ${isMyMessage(message) ? 'flex-row-reverse' : ''}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => addReaction(message._id, '👍')}
                        >
                          👍
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => addReaction(message._id, '❤️')}
                        >
                          ❤️
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => setReplyingTo(message)}
                        >
                          <Reply className="h-3 w-3" />
                        </Button>
                        
                        {isMyMessage(message) && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                setEditingMessage(message);
                                setNewMessage(message.content);
                                inputRef.current?.focus();
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500"
                              onClick={() => deleteMessage(message._id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Scroll to bottom button */}
        {showScrollButton && (
          <Button
            className="absolute bottom-4 right-4 h-8 w-8 rounded-full shadow-lg"
            size="sm"
            onClick={scrollToBottom}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Reply Indicator - Fixed above input */}
      {replyingTo && (
        <div className="px-4 py-2 bg-gray-50 border-t flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Reply className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Replying to {replyingTo.senderId.firstName}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Message Input - Fixed at bottom */}
      {user?._id ? (
        user.role === "student" ? (
          <div className="p-4 border-t flex-shrink-0 bg-gray-50">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">You can only view messages in this batch chat</p>
              <p className="text-xs text-gray-500 mt-1">Only alumni can send messages</p>
            </div>
          </div>
        ) : (
          <div className="p-4 border-t flex-shrink-0 bg-white">
          {/* Selected file preview */}
          {selectedFile && (
            <div className="mb-3 p-2 bg-gray-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{selectedFile.name}</span>
                <span className="text-xs text-gray-500">
                  ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFileUpload}
                  disabled={sending}
                >
                  {sending ? 'Uploading...' : 'Upload'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeSelectedFile}
                >
                  ×
                </Button>
              </div>
            </div>
          )}

          {/* Emoji picker */}
          {showEmojiPicker && (
            <div className="mb-3 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-10 gap-2">
                {emojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => handleEmojiSelect(emoji)}
                    className="text-lg hover:bg-gray-200 rounded p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input section rendered */}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            />
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => {
                const value = e.target.value;
                console.log("📝 Input onChange:", value);
                setNewMessage(value);
              }}
              onKeyPress={handleKeyPress}
              placeholder={editingMessage ? "Edit message..." : "Type a message..."}
              className="flex-1"
              autoComplete="off"
            />
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="h-4 w-4" />
            </Button>
            <Button
              onClick={editingMessage ? () => editMessage(editingMessage._id, newMessage) : sendMessage}
              disabled={(!newMessage.trim() && !selectedFile) || sending}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
        )
      ) : (
        <div className="p-4 border-t text-center text-muted-foreground">
          Please log in to send messages
        </div>
      )}

      {/* Chat Settings Modal */}
      {showChatSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Chat Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {settingsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading settings...</p>
                </div>
              ) : chatSettings ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Notifications</span>
                      <input
                        type="checkbox"
                        checked={chatSettings.chatSettings?.notifications || false}
                        className="rounded"
                        readOnly
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Sound Enabled</span>
                      <input
                        type="checkbox"
                        checked={chatSettings.chatSettings?.soundEnabled || false}
                        className="rounded"
                        readOnly
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Show Online Status</span>
                      <input
                        type="checkbox"
                        checked={chatSettings.chatSettings?.showOnlineStatus || false}
                        className="rounded"
                        readOnly
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Message Preview</span>
                      <input
                        type="checkbox"
                        checked={chatSettings.chatSettings?.messagePreview || false}
                        className="rounded"
                        readOnly
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Statistics</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Messages:</span>
                        <span className="ml-2 font-medium">{chatSettings.statistics?.totalMessages || 0}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Unread:</span>
                        <span className="ml-2 font-medium">{chatSettings.statistics?.unreadCount || 0}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Members:</span>
                        <span className="ml-2 font-medium">{chatSettings.statistics?.memberCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground">Failed to load settings</p>
              )}
            </CardContent>
            <div className="flex justify-end gap-2 p-4 pt-0">
              <Button variant="outline" onClick={() => setShowChatSettings(false)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Batch Info Modal */}
      {showBatchInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Batch Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {detailsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading batch details...</p>
                </div>
              ) : batchDetails ? (
                <div className="space-y-6">
                  {/* Batch Basic Info */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{batchDetails.batch?.name}</h3>
                    <p className="text-muted-foreground">{batchDetails.batch?.college} • {batchDetails.batch?.graduationYear}</p>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(batchDetails.batch?.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{batchDetails.statistics?.totalMembers || 0}</div>
                      <div className="text-sm text-blue-600">Total Members</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{batchDetails.statistics?.alumniCount || 0}</div>
                      <div className="text-sm text-green-600">Alumni</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{batchDetails.statistics?.studentCount || 0}</div>
                      <div className="text-sm text-purple-600">Students</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{batchDetails.statistics?.totalMessages || 0}</div>
                      <div className="text-sm text-orange-600">Messages</div>
                    </div>
                  </div>

                  {/* Members by Role */}
                  {batchDetails.membersByRole && Object.keys(batchDetails.membersByRole).length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold">Members by Role</h4>
                      {Object.entries(batchDetails.membersByRole).map(([role, members]: [string, any]) => (
                        <div key={role} className="space-y-2">
                          <h5 className="text-sm font-medium capitalize text-muted-foreground">
                            {role} ({members.length})
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {members.map((member: any, index: number) => (
                              <div key={index} className="flex items-center gap-2 p-2 rounded-lg border">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={member.profilePicture} />
                                  <AvatarFallback className="text-xs">
                                    {member.firstName?.[0]}{member.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {member.firstName} {member.lastName}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {member.email}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recent Activity */}
                  {batchDetails.recentActivity && batchDetails.recentActivity.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-md font-semibold">Recent Activity</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {batchDetails.recentActivity.map((message: any, index: number) => (
                          <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={message.senderId?.profilePicture} />
                              <AvatarFallback className="text-xs">
                                {message.senderId?.firstName?.[0]}{message.senderId?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium">
                                {message.senderId?.firstName} {message.senderId?.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {message.content}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(message.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">Failed to load batch details</p>
              )}
            </CardContent>
            <div className="flex justify-end gap-2 p-4 pt-0">
              <Button variant="outline" onClick={() => setShowBatchInfo(false)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
}

