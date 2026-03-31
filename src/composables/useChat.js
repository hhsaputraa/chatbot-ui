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

  // Model selection
  const selectedModel = ref("qwen/qwen3-32b");

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
        body: JSON.stringify({ 
          prompt: currentMessage,
          model: selectedModel.value
        }),
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/event-stream")) {
         const reader = response.body.getReader();
         const decoder = new TextDecoder("utf-8");
         let insightMessageRef = null;
         let buffer = "";
         
         let typingQueue = "";
         let isTyping = false;
         const typeNextChar = () => {
             if (typingQueue.length > 0 && insightMessageRef) {
                 // Ambil bbrp karakter sekaligus jika antrean panjang agar tidak terlalu lambat
                 const charsToType = typingQueue.length > 50 ? 3 : 1; 
                 insightMessageRef.content += typingQueue.substring(0, charsToType);
                 typingQueue = typingQueue.substring(charsToType);
                 setTimeout(typeNextChar, 10); // Jeda 10ms per loop iterasi huruf
             } else {
                 isTyping = false;
             }
         };

         while (true) {
            const { value, done } = await reader.read();
            
            if (value) {
               buffer += decoder.decode(value, { stream: true });
               let boundary = buffer.indexOf('\n\n');
               
               while (boundary !== -1) {
                   const eventStr = buffer.slice(0, boundary).trim();
                   buffer = buffer.slice(boundary + 2);
                   
                   if (eventStr.startsWith('data: ')) {
                       const dataStr = eventStr.slice(6).trim();
                       if (dataStr === '[DONE]') {
                           boundary = buffer.indexOf('\n\n');
                           continue;
                       }
                       
                       try {
                           const parsed = JSON.parse(dataStr);
                           if (parsed.type === 'data') {
                               processResponse({ status: 'success', data: parsed.data });
                           } else if (parsed.type === 'text') {
                               if (!insightMessageRef) {
                                   const newMsg = { role: "bot", type: "insight", content: "" };
                                   messages.value.push(newMsg);
                                   insightMessageRef = messages.value[messages.value.length - 1];
                               }
                               typingQueue += parsed.content;
                               if (!isTyping) {
                                   isTyping = true;
                                   typeNextChar();
                               }
                           }
                       } catch (e) {
                           console.error("Error parsing SSE chunk:", e);
                       }
                   }
                   boundary = buffer.indexOf('\n\n');
               }
            }
            if (done) break;
         }
      } else {
         let data;
         try {
           data = await response.json();
         } catch (parseError) {
           data = { status: "error", error_code: ERROR_CODES.INVALID_RESPONSE };
         }
         processResponse(data);
      }

    } catch (error) {
      handleNetworkError(error);
    } finally {
      isLoading.value = false;
    }
  }

  function processResponse(data) {
    if (data.status === "error") {
      if (data.error_code === ERROR_CODES.CHAT_RESPONSE) {
         messages.value.push({
          role: "bot",
          type: "warning",
          content: data.message,
        });
      } 
      else if (data.error_code === ERROR_CODES.DANGEROUS_INTENT) {
        messages.value.push({
          role: "bot",
          type: "dangerous", 
          content: "PERTANYAAN DITOLAK", 
          technicalDetail: data.message 
        });
      }
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
    selectedModel,
    startNewChat,
    handleSubmit,
    handleEnhance,
    handleSuggestionClick
  };
}
