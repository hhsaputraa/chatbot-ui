<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h2 class="auth-title">LUPA PASSWORD</h2>
        <p class="auth-subtitle">Masukkan kode OTP yang diberikan Admin</p>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
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
            />
          </div>
        </div>

        <div class="form-group">
          <label>Kode OTP</label>
          <div class="input-wrapper">
            <Icon icon="solar:shield-keyhole-bold" class="input-icon" />
            <input
              v-model="otp"
              type="text"
              placeholder="123456"
              maxlength="6"
              required
              :disabled="isLoading"
              style="letter-spacing: 2px; font-weight: 600;"
            />
          </div>
        </div>

        <button
          type="submit"
          class="auth-btn"
          :disabled="isLoading || !isValid"
        >
          <span v-if="isLoading" class="loader"></span>
          <span v-else>Masuk</span>
        </button>
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
import { ref, computed } from "vue";
import { useAuth } from "../../composables/useAuth";
import { useToast } from "../../composables/useToast";
import { Icon } from "@iconify/vue";

const { loginOtp, error: authError, isLoading } = useAuth();
const { addToast } = useToast();

const username = ref("");
const otp = ref("");

const isValid = computed(() => username.value && otp.value.length >= 4);

const handleSubmit = async () => {
  if (!username.value || !otp.value) return;

  const success = await loginOtp(username.value, otp.value);

  if (success) {
    addToast("Login OTP Berhasil!", "success");
    // Redirect logic handled inside useAuth.loginOtp
  } else {
    addToast(authError.value || "Login OTP gagal", "error");
  }
};
</script>

<style scoped>
@import './auth.css';
</style>
