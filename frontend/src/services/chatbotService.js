// src/services/chatbotService.js
import api from "./api";

/* ================= ERROR NORMALIZER ================= */

function normalizeAxiosError(err) {
  if (err?.response) {
    return {
      success: false,
      status: err.response.status,
      error:
        err.response.data?.message ||
        JSON.stringify(err.response.data),
      raw: err.response,
    };
  }

  if (err?.request) {
    return {
      success: false,
      status: null,
      error:
        "No response received (possible network/CORS/timeout).",
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

/* ================= CHATBOT SERVICE ================= */

export const chatbotService = {
  /* -------- SEND MESSAGE -------- */
  async sendMessage(
    message,
    assignmentId = null,
    conversationHistory = []
  ) {
    try {
      const payload = {
        message,
        assignmentId,
        conversationHistory,
      };

      const response = await api.post(
        "/chatbot/chat",
        payload
      );

      const data = response.data;

      // Backend returns: { success: true, message: "...", mode: "..."}
      if (data?.success) {
        return {
          success: true,
          response: data.response,
          mode: data.mode,
          status: response.status,
          raw: data,
        };
      }

      return {
        success: false,
        error: data?.message || "Unknown error",
        raw: data,
      };
    } catch (err) {
      const normalized = normalizeAxiosError(err);
      console.error(
        "chatbotService.sendMessage error:",
        normalized
      );
      return normalized;
    }
  },

  /* -------- CHECK AI STATUS -------- */
  async getStatus() {
    try {
      const response = await api.get("/chatbot/status");
      return {
        success: true,
        data: response.data,
      };
    } catch (err) {
      const normalized = normalizeAxiosError(err);
      console.error(
        "Failed to fetch AI status:",
        normalized
      );
      return normalized;
    }
  },

  /* -------- RESET CIRCUIT (optional admin use) -------- */
  async resetCircuit() {
    try {
      const response = await api.post(
        "/chatbot/reset"
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (err) {
      const normalized = normalizeAxiosError(err);
      console.error(
        "Failed to reset circuit:",
        normalized
      );
      return normalized;
    }
  },

  /* -------- LEGACY HELP -------- */
  async getHelp(assignmentId, question) {
    try {
      const response = await api.post(
        `/chatbot/help/${assignmentId}`,
        { question }
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (err) {
      const normalized = normalizeAxiosError(err);
      console.error(
        "chatbotService.getHelp error:",
        normalized
      );
      return normalized;
    }
  },

  /* -------- RESOURCES -------- */
  async getResources(topic) {
    try {
      const response = await api.post(
        "/chatbot/resources",
        { topic }
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (err) {
      const normalized = normalizeAxiosError(err);
      console.error(
        "chatbotService.getResources error:",
        normalized
      );
      return normalized;
    }
  },
};