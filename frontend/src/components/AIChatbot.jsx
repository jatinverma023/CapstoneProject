import React, { useState, useRef, useEffect } from "react";
import { chatbotService } from "../services/chatbotService";
import ReactMarkdown from "react-markdown";

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
      const result = await chatbotService.getStatus();

      if (result.success) {
        const data = result.data;

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
  // Send message helper
  const sendUserMessage = async (text) => {
    const trimmed = text?.trim();
    if (!trimmed || loading) return;

    const userMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const result = await chatbotService.sendMessage(
        trimmed,
        assignmentId,
        [],
      );

      console.log("AI RESULT:", result); // Debug log

      if (result?.success) {
        // ✅ Update AI status
        if (result.mode) {
          setAiStatus({
            mode: result.mode,
            available: result.mode !== "circuit_breaker",
          });
        }

        // ✅ Update rate limit
        if (result.metadata?.rateLimit) {
          setRateLimitInfo(result.metadata.rateLimit);
        }

        // ✅ Add AI message
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: result.response || "⚠️ No response received.",
            mode: result.mode,
            emoji: getModeEmoji(result.mode),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              result?.error ||
              "❌ Sorry, I encountered an error. Please try again.",
          },
        ]);
      }
    } catch (err) {
      console.error("Chat error:", err);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "❌ Failed to connect. Please check your connection and try again.",
        },
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
          className="fixed bottom-6 right-6 w-16 h-16 
    bg-gradient-to-br from-purple-600 to-blue-600 
    text-white rounded-full shadow-2xl 
    hover:scale-110 hover:shadow-purple-400/40
    transition-all duration-300 
    flex items-center justify-center z-50"
          title="AI Assistant"
        >
          <span className="text-2xl">🤖</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 w-[420px] h-[620px] 
    bg-white/80 backdrop-blur-xl 
    rounded-3xl shadow-2xl 
    flex flex-col z-50 
    border border-white/40"
        >
          {/* Header */}
          <div
            className="bg-gradient-to-r from-purple-600 to-blue-600 
    text-white p-4 rounded-t-3xl shadow-md"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  🤖
                </div>
                <div>
                  <h3 className="font-semibold text-lg">AI Study Assistant</h3>
                  <div className="flex items-center gap-2 text-xs opacity-90">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        aiStatus.available
                          ? "bg-green-400 animate-pulse"
                          : "bg-yellow-400"
                      }`}
                    ></span>
                    {aiStatus.available ? "Online" : "Limited Mode"}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-2 rounded-lg transition"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-transparent">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex animate-fadeIn ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-md"
                      : "bg-white shadow-sm text-gray-800"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="text-xs mb-1 opacity-60">
                      {msg.emoji || "🤖"} Assistant
                    </div>
                  )}

                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-2 rounded-2xl shadow-sm">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-150"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-300"></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={sendMessage}
            className="p-4 bg-white/70 backdrop-blur-md rounded-b-3xl"
          >
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={loading}
                className="flex-1 px-4 py-2 bg-white 
          border border-gray-200 rounded-full 
          focus:outline-none focus:ring-2 
          focus:ring-purple-500 text-sm shadow-sm"
              />

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-5 py-2 bg-gradient-to-br 
          from-purple-600 to-blue-600 text-white 
          rounded-full shadow-md hover:opacity-90 
          disabled:opacity-50 transition text-sm"
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
