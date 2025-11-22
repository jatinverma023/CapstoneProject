import React, { useState, useRef, useEffect } from "react";
import { chatbotService } from "../services/chatbotService";

const AIChatbot = ({ assignmentId = null, assignmentTitle = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState({
    mode: "unknown",
    available: true,
  });
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  const messagesEndRef = useRef(null);

  // Initial message
  const initialAssistantContent = (title) =>
    `👋 Hi! I'm your AI Study Assistant. ${
      title
        ? `I can help you with "${title}"`
        : "Ask me anything about your assignments!"
    }`;

  // Initialize messages
  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: initialAssistantContent(assignmentTitle),
      },
    ]);
  }, [assignmentTitle]);

  // Scroll to bottom
  const scrollToBottom = () => {
    try {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Fetch AI status when chat opens
  useEffect(() => {
    if (isOpen) {
      fetchAIStatus();
    }
  }, [isOpen]);

  const fetchAIStatus = async () => {
    try {
      const response = await fetch("/api/v1/chatbot/status", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAiStatus({
          mode: data.circuit?.state || "CLOSED",
          available: data.circuit?.state !== "OPEN",
          cooldown: data.circuit?.cooldownRemaining,
        });
      }
    } catch (err) {
      console.error("Failed to fetch AI status:", err);
    }
  };

  // Send message helper
  const sendUserMessage = async (text) => {
    const trimmed = text?.trim();
    if (!trimmed || loading) return;

    // Add user message
    const userMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const result = await chatbotService.sendMessage(
        trimmed,
        assignmentId,
        null
      );

      if (result && result.success) {
        // Update AI status
        if (result.metadata?.mode) {
          setAiStatus({
            mode: result.metadata.mode,
            available: result.metadata.mode !== "circuit_breaker",
            cooldown: result.metadata.circuitState?.cooldownRemaining,
          });
        }

        // Update rate limit info
        if (result.metadata?.rateLimit) {
          setRateLimitInfo(result.metadata.rateLimit);
        }

        // Add assistant reply with status indicator
        const modeEmoji = getModeEmoji(result.metadata?.mode);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: result.response,
            mode: result.metadata?.mode,
            emoji: modeEmoji,
          },
        ]);
      } else {
        // Error response
        const errorMsg =
          result?.message ||
          "❌ Sorry, I encountered an error. Please try again.";
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: errorMsg },
        ]);
      }
    } catch (err) {
      console.error("Chat error:", err);

      let errorMessage = "❌ Failed to connect. ";
      if (err?.response?.status === 429) {
        errorMessage +=
          "You're sending messages too quickly. Please wait a moment.";
      } else if (err?.response?.status === 503) {
        errorMessage +=
          "AI service is temporarily unavailable. I'll use offline assistance.";
        setAiStatus({ mode: "offline", available: false });
      } else {
        errorMessage += "Please check your connection and try again.";
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: errorMessage },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Get emoji for AI mode
  const getModeEmoji = (mode) => {
    const modeMap = {
      generative_api: "🤖",
      smart_assistant: "💡",
      circuit_breaker: "⚠️",
      no_api_key: "📚",
      offline: "📴",
    };
    return modeMap[mode] || "🤖";
  };

  // Form submit
  const sendMessage = async (e) => {
    e.preventDefault();
    await sendUserMessage(input);
  };

  const quickQuestions = [
    "How do I start this assignment?",
    "Can you explain the requirements?",
    "What are the key points to cover?",
    "Suggest study resources",
  ];

  // Handle quick question
  const handleQuickQuestion = (question) => {
    setInput(question);
    setTimeout(() => sendUserMessage(question), 50);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 flex items-center justify-center z-50"
          title="AI Assistant"
        >
          <span className="text-3xl">🤖</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border-2 border-purple-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-2xl">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-2xl">🤖</span>
                <div className="flex-1">
                  <h3 className="font-bold">AI Study Assistant</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-xs opacity-90">
                      {aiStatus.available ? "Online" : "Limited Mode"}
                    </p>
                    {!aiStatus.available && aiStatus.cooldown && (
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                        ~{aiStatus.cooldown}s
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Rate limit indicator */}
            {rateLimitInfo && rateLimitInfo.remaining < 3 && (
              <div className="mt-2 text-xs bg-white/10 px-2 py-1 rounded">
                ⚡ {rateLimitInfo.remaining} messages remaining this minute
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                      : "bg-white text-gray-800 shadow-md border border-gray-200"
                  }`}
                >
                  {msg.emoji && msg.role === "assistant" && (
                    <span className="text-xs mr-2">{msg.emoji}</span>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.mode && msg.mode !== "generative_api" && (
                    <p className="text-xs opacity-60 mt-1">
                      {msg.mode === "smart_assistant" && "(Offline mode)"}
                      {msg.mode === "circuit_breaker" &&
                        "(Service unavailable)"}
                      {msg.mode === "no_api_key" && "(Limited mode)"}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-2 rounded-2xl shadow-md border border-gray-200">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <div
                      className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="p-3 border-t border-gray-200 bg-white">
              <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickQuestion(q)}
                    disabled={loading}
                    className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={sendMessage}
            className="p-4 border-t border-gray-200 bg-white rounded-b-2xl"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  aiStatus.available
                    ? "Ask me anything..."
                    : "Limited offline mode..."
                }
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity font-medium text-sm"
              >
                {loading ? "..." : "Send"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default AIChatbot;
