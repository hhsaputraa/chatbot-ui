<template>
  <div class="admin-container">
    <div class="admin-card">
      <div class="header">
        <Icon icon="solar:shield-keyhole-bold" class="header-icon" />
        <h2>OTP Generator</h2>
        <p>Generate OTP dan Reset Password User</p>
      </div>

      <div class="form-content">
        <div class="input-group">
          <label>Username Target</label>
          <div class="input-wrapper">
            <Icon icon="heroicons:user" class="input-icon" />
            <input 
              v-model="targetUsername" 
              type="text" 
              placeholder="Masukkan username user"
              :disabled="isLoading"
            />
          </div>
        </div>

        <div class="input-group">
          <label>Set Default Password</label>
          <div class="input-wrapper">
            <Icon icon="heroicons:lock-closed" class="input-icon" />
            <input 
              v-model="defaultPassword" 
              :type="showPassword ? 'text' : 'password'" 
              placeholder="Password sementara"
              :disabled="isLoading"
            />
            <button
               type="button"
               class="eye-btn"
               @click="showPassword = !showPassword"
               tabindex="-1"
             >
               <Icon
                 :icon="showPassword ? 'heroicons:eye-slash' : 'heroicons:eye'"
               />
             </button>
          </div>
          <small style="color: var(--text-muted); margin-top: 4px; display: block;">
            Info: Password user akan direset menjadi ini.
          </small>
        </div>

        <button 
          @click="handleGenerate" 
          class="generate-btn"
          :disabled="isLoading || !isValid"
        >
          <span v-if="isLoading" class="loader"></span>
          <span v-else>Generate OTP</span>
        </button>

        <!-- Result Card -->
        <div v-if="generatedOtp" class="result-card">
          <div class="result-header">
            <Icon icon="heroicons:check-badge" class="success-icon" />
            <span>OTP Berhasil Dibuat!</span>
          </div>
          
          <div class="otp-display">
            {{ generatedOtp }}
          </div>
          
          <div class="copy-section">
            <p class="instruction">Berikan kredensial ini ke user:</p>
            <div class="credential-box">
              <p><strong>Username:</strong> {{ targetUsername }}</p>
              <p><strong>Password:</strong> {{ defaultPassword }}</p>
              <p><strong>OTP Code:</strong> {{ generatedOtp }} (Valid 5 menit)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAdminOtp } from '../../composables/useAdminOtp';
import { Icon } from '@iconify/vue';

const { generateOtp, isLoading, generatedOtp } = useAdminOtp();

const targetUsername = ref('');
const defaultPassword = ref(''); // Admin can type manual or leave empty? User requirement said "Admin sets Default Password"
const showPassword = ref(false);

const isValid = computed(() => targetUsername.value && defaultPassword.value);

const handleGenerate = async () => {
  if (!isValid.value) return;
  await generateOtp(targetUsername.value, defaultPassword.value);
};
</script>

<style scoped>
.admin-container {
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 80vh;
}

.admin-card {
  background: var(--bg-darker);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header-icon {
  font-size: 3rem;
  color: #f59e0b;
  margin-bottom: 1rem;
}

.header h2 {
  color: var(--text-light);
  margin-bottom: 0.5rem;
}

.header p {
  color: var(--text-muted);
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  color: var(--text-light);
  font-weight: 500;
  font-size: 0.9rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  color: var(--text-muted);
  font-size: 1.2rem;
}

.input-wrapper input {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  padding: 10px 10px 10px 40px;
  border-radius: 8px;
  color: var(--text-light);
  font-size: 0.95rem;
  transition: all 0.2s;
}

.input-wrapper input:focus {
  border-color: #f59e0b;
  outline: none;
  background: rgba(245, 158, 11, 0.05);
}

.generate-btn {
  background: #f59e0b;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
}

.generate-btn:hover:not(:disabled) {
  background: #d97706;
}

.generate-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.result-card {
  margin-top: 1rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 8px;
  padding: 1.5rem;
  animation: fadeIn 0.3s ease;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #10b981;
  font-weight: 600;
  margin-bottom: 1rem;
}

.otp-display {
  font-size: 2rem;
  font-weight: 800;
  text-align: center;
  letter-spacing: 4px;
  color: #10b981;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px dashed rgba(16, 185, 129, 0.4);
}

.copy-section .instruction {
  font-size: 0.9rem;
  color: var(--text-light);
  margin-bottom: 0.5rem;
}

.credential-box {
  background: rgba(0, 0, 0, 0.3);
  padding: 1rem;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.9rem;
  color: #e2e8f0;
}

.eye-btn {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
}

.loader {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-bottom-color: white;
  border-radius: 50%;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
