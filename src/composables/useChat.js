import { ref, nextTick } from 'vue';
import { API_ENDPOINTS, ERROR_CODES } from '../constants/api';
import { getFriendlyErrorMessage } from '../utils/errorHandler';
import { useTablePagination } from './useTablePagination';

const START_MESSAGE = import.meta.env.VITE_CHAT_START_MESSAGE;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function useChat() {
  const messages = ref([]);
  const userInput = ref("");
  const isLoading = ref(false);
  
  // Enhancement state
  const isEnhancing = ref(false);
  const enhanceCooldown = ref(0);
  let cooldownInterval = null;

  const { initPagination } = useTablePagination();

  function startNewChat() {
    messages.value = [];
    nextTick(() => {
      messages.value.push({ role: "bot", type: "text", content: START_MESSAGE });
    });
  }

  function handleSuggestionClick(text) {
    userInput.value = text;
    handleSubmit();
  }

  async function handleEnhance() {
    if (!userInput.value.trim() || isEnhancing.value || enhanceCooldown.value > 0)
      return;

    isEnhancing.value = true;
    const originalText = userInput.value;

    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ENHANCE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft_prompt: originalText }),
      });

      const data = await response.json();

      if (data.enhanced_prompt) {
        userInput.value = data.enhanced_prompt;
      } else {
        console.error("Enhancement failed:", data);
      }
    } catch (error) {
      console.error("Error enhancing text:", error);
    } finally {
      isEnhancing.value = false;
      startCooldown();
    }
  }

  function startCooldown() {
    enhanceCooldown.value = 15;
    cooldownInterval = setInterval(() => {
      enhanceCooldown.value--;
      if (enhanceCooldown.value <= 0) {
        clearInterval(cooldownInterval);
        cooldownInterval = null;
      }
    }, 1000);
  }

  async function handleSubmit() {
    if (!userInput.value.trim()) return;
    
    const currentMessage = userInput.value;
    userInput.value = "";
    isLoading.value = true;

    messages.value.push({ role: "user", type: "text", content: currentMessage });

    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.QUERY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: currentMessage }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        data = { status: "error", error_code: ERROR_CODES.INVALID_RESPONSE };
      }

      processResponse(data);

    } catch (error) {
      handleNetworkError(error);
    } finally {
      isLoading.value = false;
    }
  }

  function processResponse(data) {
    if (data.status === "error") {
      // 1. Soft Refusal (Conversational) - Amber
      if (data.error_code === ERROR_CODES.CHAT_RESPONSE) {
         messages.value.push({
          role: "bot",
          type: "warning",
          content: data.message,
        });
      } 
      // 2. Dangerous Intent (Security Block) - Red, No Header
      else if (data.error_code === ERROR_CODES.DANGEROUS_INTENT) {
        messages.value.push({
          role: "bot",
          type: "dangerous", // Specialized type
          content: "PERTANYAAN DITOLAK", 
          technicalDetail: data.message // Keep original detail if needed for admin, or remove if strictly hidden
        });
      }
      // 3. System Error - Red with Header
      else {
        messages.value.push({
          role: "bot",
          type: "error",
          content: getFriendlyErrorMessage(data),
          technicalDetail: data.message
        });
      }
    } else if (data.status === "ambiguous") {
      messages.value.push({
        role: "bot",
        type: "suggestion",
        content: data.message,
        suggestions: data.suggestions,
      });
    } else if (data.status === "success" && data.data && data.data.rows) {
        const messageIndex = messages.value.length;
        messages.value.push({ role: "bot", type: "data", data: data.data });
        if (data.data.rows.length > 0) {
             initPagination(messageIndex, data.data.rows.length);
        }
    } else {
      messages.value.push({
        role: "bot",
        type: "text",
        content: data.message || "Perintah berhasil dieksekusi.",
      });
    }
  }

  function handleNetworkError(error) {
    let errorMsg = "Terjadi kesalahan yang tidak diketahui.";
    
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      errorMsg = "Perangkat Anda sedang offline. Periksa koneksi internet Anda.";
    } else if (error?.message?.includes("Failed to fetch")) {
      errorMsg = "Tidak dapat terhubung dengan server";
    }

    messages.value.push({
      role: "bot",
      type: "error",
      content: getFriendlyErrorMessage({ message: errorMsg }), // Fallback using the same styling
      technicalDetail: error?.message
    });
  }

  return {
    messages,
    userInput,
    isLoading,
    isEnhancing,
    enhanceCooldown,
    startNewChat,
    handleSubmit,
    handleEnhance,
    handleSuggestionClick
  };
}
