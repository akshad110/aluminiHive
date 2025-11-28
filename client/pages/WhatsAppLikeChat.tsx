import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import UnifiedChatPage from "./UnifiedChatPage";
import EmbeddedChat from "../components/EmbeddedChat";

export default function WhatsAppLikeChat() {
  const [selectedChat, setSelectedChat] = useState<{ id: string; type: "batch" | "personal" } | null>(null);
  const [searchParams] = useSearchParams();

  const handleChatSelect = (chatId: string, type: "batch" | "personal") => {
    setSelectedChat({ id: chatId, type });
  };

  const handleBack = () => {
    setSelectedChat(null);
  };

  // Handle URL parameters for personal chats
  useEffect(() => {
    const personalId = searchParams.get('personal');
    if (personalId) {
      setSelectedChat({ id: personalId, type: "personal" });
    }
  }, [searchParams]);

  // Listen for custom events from alumni member clicks
  useEffect(() => {
    const handleSelectPersonalChat = (event: CustomEvent) => {
      const { chatId, type } = event.detail;
      setSelectedChat({ id: chatId, type });
    };

    window.addEventListener('selectPersonalChat', handleSelectPersonalChat as EventListener);
    
    return () => {
      window.removeEventListener('selectPersonalChat', handleSelectPersonalChat as EventListener);
    };
  }, []);

  return (
    <div className="h-screen flex bg-gray-100 relative">
      {/* Left Sidebar - Chat List */}
      <div className={`
        ${selectedChat ? 'hidden' : 'flex'} 
        lg:flex 
        w-full 
        lg:w-1/3 
        xl:w-1/4 
        lg:min-w-80 
        border-r 
        bg-white 
        flex-col
        absolute 
        lg:relative 
        z-10 
        h-full
      `}>
        <UnifiedChatPage onChatSelect={handleChatSelect} />
      </div>

      {/* Right Side - Chat Content */}
      <div className={`
        ${selectedChat ? 'flex' : 'hidden'} 
        lg:flex 
        flex-1 
        flex-col 
        w-full 
        lg:w-auto
        absolute 
        lg:relative 
        z-20 
        h-full
        bg-white
      `}>
        {selectedChat ? (
          <EmbeddedChat 
            chatId={selectedChat.id} 
            type={selectedChat.type}
            onBack={handleBack}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to AlumniHive Chat</h3>
              <p className="text-gray-500">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
