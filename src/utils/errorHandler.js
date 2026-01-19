import { ERROR_CODES } from '../constants/api';

/**
 * Format error message based on backend error codes
 * @param {Object} errorData - Error response from backend
 * @returns {string} - Formatted error message for user
 */
export function getFriendlyErrorMessage(errorData) {
  const { error_code, message } = errorData;

  switch (error_code) {
    case ERROR_CODES.METHOD_NOT_ALLOWED:
      return "Metode HTTP tidak diizinkan.";

    case ERROR_CODES.INVALID_JSON:
      return "Format permintaan tidak valid. Silakan coba lagi.";

    case ERROR_CODES.EMPTY_PROMPT:
      return "Pertanyaan tidak boleh kosong. Silakan masukkan pertanyaan Anda.";

    case ERROR_CODES.AI_GENERATION_FAILED:
      return "Sistem AI sedang mengalami gangguan. Silakan coba lagi dalam beberapa saat.";

    case ERROR_CODES.EMPTY_SQL:
      return "AI tidak dapat menghasilkan query yang valid. Silakan perbaiki pertanyaan Anda.";

    case ERROR_CODES.DANGEROUS_INTENT:
      return "DITOLAK. Silakan ganti pertanyaan Anda.";

    case ERROR_CODES.QUERY_EXECUTION_FAILED:
      return `Query tidak dapat dieksekusi. ${message || "Silakan perbaiki pertanyaan Anda."}`;

    case ERROR_CODES.AI_REFUSAL:
      return message;

    default:
      return message || "Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.";
  }
}
