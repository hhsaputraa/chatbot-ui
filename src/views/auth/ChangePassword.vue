<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <Icon icon="solar:shield-warning-bold" class="app-logo" style="font-size: 3rem; color: var(--primary-blue); margin-bottom: 1rem;" />
        <h1 class="auth-title">Ganti Password</h1>
        <p class="auth-subtitle">Anda diwajibkan mengganti password untuk keamanan.</p>
      </div>

      <div class="auth-form">
        <div class="form-group">
          <label for="oldPassword">Password Lama</label>
          <div class="input-wrapper">
            <Icon icon="solar:lock-password-bold" class="input-icon" />
            <input 
              :type="showOld ? 'text' : 'password'" 
              id="oldPassword" 
              v-model="oldPassword" 
              placeholder="Masukkan password lama"
              required
            />
            <button
               type="button"
               class="eye-btn"
               @click="showOld = !showOld"
               tabindex="-1"
             >
               <Icon
                 :icon="showOld ? 'heroicons:eye-slash' : 'heroicons:eye'"
               />
             </button>
          </div>
        </div>

        <div class="form-group">
          <label for="newPassword">Password Baru</label>
          <div class="input-wrapper">
            <Icon icon="solar:key-square-bold" class="input-icon" />
            <input 
              :type="showNew ? 'text' : 'password'" 
              id="newPassword" 
              v-model="newPassword" 
              placeholder="Masukkan password baru"
              required
            />
             <button
               type="button"
               class="eye-btn"
               @click="showNew = !showNew"
               tabindex="-1"
             >
               <Icon
                 :icon="showNew ? 'heroicons:eye-slash' : 'heroicons:eye'"
               />
             </button>
          </div>
          
           <!-- Strength Bar -->
           <div class="strength-meter" v-if="newPassword">
             <div class="strength-bar-bg">
               <div
                 class="strength-bar-fill"
                 :style="{
                   width: strengthInfo.width,
                   backgroundColor: strengthInfo.color,
                 }"
               ></div>
             </div>
             <span
               class="strength-label"
               :style="{ color: strengthInfo.color }"
               >{{ strengthInfo.label }}</span
             >
           </div>
           <!-- Requirements Checklist -->
           <ul class="pw-requirements" v-if="newPassword && strengthScore < 4">
             <li :class="{ met: passwordRules.minLength }">6+ chars</li>
             <li :class="{ met: passwordRules.hasUpper }">Upper</li>
             <li :class="{ met: passwordRules.hasNumber }">Num</li>
             <li :class="{ met: passwordRules.hasSymbol }">Sym</li>
           </ul>
        </div>

        <div class="form-group">
          <label for="confirmPassword">Konfirmasi Password Baru</label>
          <div class="input-wrapper">
            <Icon icon="solar:check-circle-bold" class="input-icon" />
            <input 
              :type="showConfirm ? 'text' : 'password'" 
              id="confirmPassword" 
              v-model="confirmPassword" 
              placeholder="Ulangi password baru"
              required
            />
             <button
               type="button"
               class="eye-btn"
               @click="showConfirm = !showConfirm"
               tabindex="-1"
             >
               <Icon
                 :icon="showConfirm ? 'heroicons:eye-slash' : 'heroicons:eye'"
               />
             </button>
          </div>
        </div>

        <button @click="handleSubmit" :disabled="isLoading || !isValid" class="auth-btn">
          <span v-if="!isLoading">Ganti Password</span>
          <span v-else class="loader"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuth } from '../../composables/useAuth';
import { useToast } from '../../composables/useToast';
import { Icon } from '@iconify/vue';
import { useRouter } from 'vue-router';

const { changePassword, isLoading, error: authError } = useAuth();
const { addToast } = useToast();
const router = useRouter();

const oldPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const showOld = ref(false);
const showNew = ref(false);
const showConfirm = ref(false);

// Password Validation Rules
const passwordRules = computed(() => {
  const pwd = newPassword.value;
  return {
    minLength: pwd.length >= 6,
    hasUpper: /[A-Z]/.test(pwd),
    hasNumber: /[0-9]/.test(pwd),
    hasSymbol: /[^A-Za-z0-9]/.test(pwd),
  };
});

// Strength Score
const strengthScore = computed(() => {
  let score = 0;
  if (passwordRules.value.minLength) score++;
  if (passwordRules.value.hasUpper) score++;
  if (passwordRules.value.hasNumber) score++;
  if (passwordRules.value.hasSymbol) score++;
  return score;
});

// Strength Label & Color
const strengthInfo = computed(() => {
  const score = strengthScore.value;
  if (score === 0)
    return {
      label: "Enter Password",
      color: "var(--border-color)",
      width: "0%",
    };
  if (score < 2) return { label: "Weak", color: "#EF4444", width: "25%" };
  if (score < 3) return { label: "Fair", color: "#F59E0B", width: "50%" };
  if (score < 4) return { label: "Good", color: "#3B82F6", width: "75%" };
  return { label: "Strong", color: "#10B981", width: "100%" };
});


const isValid = computed(() => {
  return oldPassword.value && newPassword.value && confirmPassword.value && newPassword.value === confirmPassword.value && strengthScore.value === 4;
});

async function handleSubmit() {
    if (newPassword.value !== confirmPassword.value) {
        addToast('Password baru dan konfirmasi tidak cocok.', 'error');
        return;
    }

    const success = await changePassword(oldPassword.value, newPassword.value);
    
    if (success) {
        addToast('Password berhasil diganti!', 'success');
        // Redirect will be handled by logic or we do it here if useAuth returns true
        router.push('/');
    } else {
        addToast(authError.value || 'Gagal mengganti password.', 'error');
    }
}
</script>

<style scoped>
@import './auth.css';
</style>
