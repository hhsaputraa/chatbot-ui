<template>
  <div class="auth-container">
    <div class="auth-card">
      
      <!-- Back Button for Step 2 -->
      <button v-if="step === 2" @click="step = 1" class="back-btn-top">
         <Icon icon="heroicons:arrow-left" />
      </button>

      <div class="auth-header">
        <h2 class="auth-title">LUPA PASSWORD</h2>
        <p class="auth-subtitle">
            {{ step === 1 ? 'Masukkan username akun anda' : 'Masukkan kode OTP yang diberikan Admin' }}
        </p>
      </div>

      <form @submit.prevent="handleNext" class="auth-form">
        
        <!-- STEP 1: USERNAME -->
        <div v-if="step === 1" class="form-step">
            <div class="form-group">
            <label>Username</label>
            <div class="input-wrapper">
                <Icon icon="heroicons:user" class="input-icon" />
                <input
                v-model="username"
                type="text"
                placeholder="Username anda"
                required
                :disabled="isLoading"
                ref="usernameInput"
                />
            </div>
            </div>
            
            <button
                type="submit"
                class="auth-btn"
                :disabled="!username"
            >
                Lanjut
                <Icon icon="heroicons:arrow-right" style="margin-left: 8px;" />
            </button>
        </div>

        <!-- STEP 2: OTP -->
        <div v-if="step === 2" class="form-step">
             <div class="form-group">
                <label>Kode OTP</label>
                <div class="otp-container">
                    <input
                    v-for="(digit, index) in otpDigits"
                    :key="index"
                    ref="otpInputs"
                    v-model="otpDigits[index]"
                    type="text"
                    inputmode="numeric"
                    maxlength="1"
                    class="otp-box"
                    :disabled="isLoading"
                    @input="handleInput($event, index)"
                    @keydown.delete="handleDelete($event, index)"
                    @paste="handlePaste"
                    @focus="handleFocus($event)"
                    />
                </div>
            </div>

            <button
                type="button"
                @click="handleSubmit"
                class="auth-btn"
                :disabled="isLoading || !isValidOtp"
            >
                <span v-if="isLoading" class="loader"></span>
                <span v-else>Masuk</span>
            </button>
        </div>

      </form>

      <div class="auth-footer">
        <p>
          Kembali ke
          <router-link to="/login">Login</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from "vue";
import { useAuth } from "../../composables/useAuth";
import { useToast } from "../../composables/useToast";
import { Icon } from "@iconify/vue";

const { loginOtp, error: authError, isLoading } = useAuth();
const { addToast } = useToast();

const step = ref(1);
const username = ref("");
const usernameInput = ref(null);

const otpDigits = ref(['', '', '', '', '', '']);
const otpInputs = ref([]);

const isValidOtp = computed(() => {
    return otpDigits.value.every(d => d.length === 1);
});

const handleNext = () => {
    if (username.value) {
        step.value = 2;
        // Auto focus first otp input
        nextTick(() => {
             otpInputs.value[0]?.focus();
        });
    }
};

const handleInput = (e, index) => {
    const val = e.target.value.replace(/\D/g, ''); 
    otpDigits.value[index] = val; 

    if (val && index < 5) {
        otpInputs.value[index + 1]?.focus();
    }
    
    // Auto submit on last digit fill? User didn't ask but nice to have.
    // Let's stick to manual button press to match "button next then button login" request
};

const handleDelete = (e, index) => {
    if (!otpDigits.value[index] && index > 0) {
        otpInputs.value[index - 1]?.focus();
    }
};

const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    pasteData.split('').forEach((char, i) => {
        otpDigits.value[i] = char;
    });
    
    const nextIndex = Math.min(pasteData.length, 5);
    nextTick(() => otpInputs.value[nextIndex]?.focus());
};

const handleFocus = (e) => {
    e.target.select();
};

const handleSubmit = async () => {
    if (!isValidOtp.value) return;
    const otpCode = otpDigits.value.join('');

    const success = await loginOtp(username.value, otpCode);

    if (success) {
        addToast("Berhasil!, mengalihkan ke halaman ganti password", "success");
    } else {
        addToast(authError.value || "Login OTP gagal", "error");
    }
};

onMounted(() => {
    nextTick(() => usernameInput.value?.focus());
});
</script>

<style scoped>
@import './auth.css';

.auth-card {
    position: relative;
    /* Ensure min-height so it doesn't jump too much between steps */
    min-height: 400px; 
    display: flex;
    flex-direction: column;
}

.back-btn-top {
    position: absolute;
    top: 2rem;
    left: 2rem;
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    transition: color 0.2s;
}
.back-btn-top:hover {
    color: var(--text-light);
}

.form-step {
    animation: fadeIn 0.3s ease;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.otp-container {
    display: flex;
    gap: 12px;
    justify-content: space-between;
}

.otp-box {
    width: 100%;
    height: 60px;
    border-radius: 12px;
    border: 1px solid var(--border-color);
    background: rgba(255, 255, 255, 0.03);
    color: var(--text-light);
    font-size: 1.5rem;
    font-weight: 700;
    text-align: center;
    transition: all 0.2s;
    padding: 0 !important; 
}

.otp-box:focus {
    border-color: var(--primary-blue);
    background: rgba(59, 130, 246, 0.1);
    outline: none;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
    transform: translateY(-2px);
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateX(10px); }
    to { opacity: 1; transform: translateX(0); }
}
</style>
