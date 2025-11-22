// src/services/chatbotService.js
import api from "./api";
function normalizeAxiosError(err) {
  // axios error structure:
  // err.response -> server responded with a status outside 2xx
  // err.request -> request made but no response (network/CORS/timeout)
  // err.message -> generic message (e.g. timeout)
  if (err?.response) {
    return {
      success: false,
      status: err.response.status,
      error: typeof err.response.data === "string"
        ? err.response.data
        : JSON.stringify(err.response.data),
      raw: err.response,
    };
  }
  if (err?.request) {
    return {
      success: false,
      status: null,
      error: "No response received (possible network/CORS/timeout).",
      raw: err.request,
    };
  }
  return {
    success: false,
    status: null,
    error: err?.message || "Unknown error",
    raw: err,
  };
}

export const chatbotService = {
  // message: string
  // assignmentId: optional id
  // conversationHistory: optional array (pass [] if unused)
  async sendMessage(message, assignmentId = null, conversationHistory = []) {
    try {
      const payload = { message, assignmentId, conversationHistory };

      // api is an axios instance; it should have timeout set, but we also rely on axios timeout
      const response = await api.post("/chatbot/chat", payload);

      // Expect backend to return something like { reply: "..." } or { success: true, reply: "..."}
      // Normalize to { success: true, response: string }
      const data = response.data;
      // if backend uses { success: true, response: '...' } prefer that
      if (data && (data.reply || data.response || data.result)) {
        const reply = data.reply ?? data.response ?? data.result;
        return { success: true, response: reply, status: response.status, raw: data };
      }

      // If backend returned plain text or unexpected shape, still return it
      return { success: true, response: data, status: response.status, raw: data };
    } catch (err) {
      const normalized = normalizeAxiosError(err);
      console.error("chatbotService.sendMessage error:", normalized);
      return normalized;
    }
  },

  async getHelp(assignmentId, question) {
    try {
      const response = await api.post(`/chatbot/help/${assignmentId}`, { question });
      return { success: true, response: response.data, status: response.status, raw: response.data };
    } catch (err) {
      const normalized = normalizeAxiosError(err);
      console.error("chatbotService.getHelp error:", normalized);
      return normalized;
    }
  },

  async getResources(topic) {
    try {
      const response = await api.post("/chatbot/resources", { topic });
      return { success: true, response: response.data, status: response.status, raw: response.data };
    } catch (err) {
      const normalized = normalizeAxiosError(err);
      console.error("chatbotService.getResources error:", normalized);
      return normalized;
    }
  },
};
