import { ref } from 'vue';
import { useToast } from './useToast';
import { encryptField } from '../utils/crypto';

export function useAdminOtp() {
  const isLoading = ref(false);
  const error = ref(null);
  const generatedOtp = ref(null);
  
  const { showToast } = useToast();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  async function generateOtp(username, defaultPassword) {
    isLoading.value = true;
    error.value = null;
    generatedOtp.value = null;

    try {
      // Encrypt sensitive data
      const encryptedPassword = encryptField(defaultPassword);

      const response = await fetch(`${API_BASE_URL}/admin/otp/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password: encryptedPassword
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal generate OTP');
      }

      generatedOtp.value = data.otp;
      showToast('OTP Berhasil digenerate', 'success');
      return { success: true, message: data.message, otp: data.otp };

    } catch (err) {
      error.value = err.message;
      showToast(err.message, 'error');
      return { success: false, message: err.message };
    } finally {
      isLoading.value = false;
    }
  }

  return {
    isLoading,
    error,
    generatedOtp,
    generateOtp
  };
}
