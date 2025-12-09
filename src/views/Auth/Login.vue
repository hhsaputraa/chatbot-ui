<template>
  <div class="auth-container">
    <div class="auth-card">
      <!-- Logo/Header -->
      <div class="auth-header">
        <div class="logo-icon">
          <Icon icon="mdi:robot" width="48" height="48" />
        </div>
        <h1 class="auth-title">Selamat Datang</h1>
        <p class="auth-subtitle">Login ke BPR Supra Chatbot</p>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="error-banner">
        <Icon icon="mdi:alert-circle" width="20" height="20" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Success Message -->
      <div v-if="successMessage" class="success-banner">
        <Icon icon="mdi:check-circle" width="20" height="20" />
        <span>{{ successMessage }}</span>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="auth-form">
        <!-- Username Field -->
        <div class="form-group">
          <label for="username" class="form-label">
            <Icon icon="mdi:account" width="18" height="18" />
            Username
          </label>
          <input
            id="username"
            v-model="formData.username"
            type="text"
            class="form-input"
            placeholder="Masukkan username"
            required
            autocomplete="username"
            :disabled="isLoading"
          />
        </div>

        <!-- Password Field -->
        <div class="form-group">
          <label for="password" class="form-label">
            <Icon icon="mdi:lock" width="18" height="18" />
            Password
          </label>
          <div class="password-input-wrapper">
            <input
              id="password"
              v-model="formData.password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="Masukkan password"
              required
              autocomplete="current-password"
              :disabled="isLoading"
            />
            <button
              type="button"
              class="password-toggle"
              @click="showPassword = !showPassword"
              :disabled="isLoading"
            >
              <Icon
                :icon="showPassword ? 'mdi:eye-off' : 'mdi:eye'"
                width="20"
                height="20"
              />
            </button>
          </div>
        </div>

        <!-- Submit Button -->
        <button type="submit" class="submit-btn" :disabled="isLoading">
          <Icon
            v-if="isLoading"
            icon="mdi:loading"
            width="20"
            height="20"
            class="spin"
          />
          <Icon v-else icon="mdi:login" width="20" height="20" />
          <span>{{ isLoading ? "Memproses..." : "Login" }}</span>
        </button>
      </form>

      <!-- Register Link -->
      <div class="auth-footer">
        <p>
          Belum punya akun?
          <router-link to="/register" class="auth-link">Daftar di sini</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRouter, useRoute } from "vue-router"
import { Icon } from "@iconify/vue"
import { useAuth } from "../../composables/useAuth"

const router = useRouter()
const route = useRoute()
const { login, isAuthenticated } = useAuth()

const formData = ref({
  username: "",
  password: "",
})

const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref("")
const successMessage = ref("")

// Check if already logged in
onMounted(() => {
  if (isAuthenticated.value) {
    router.push("/")
  }
  
  // Check for success message from registration
  if (route.query.registered === "true") {
    successMessage.value = "Registrasi berhasil! Silakan login."
  }
})

async function handleLogin() {
  errorMessage.value = ""
  successMessage.value = ""
  isLoading.value = true

  const result = await login(formData.value.username, formData.value.password)

  isLoading.value = false

  if (result.success) {
    // Redirect to intended page or home
    const redirectTo = route.query.redirect || "/"
    router.push(redirectTo)
  } else {
    errorMessage.value = result.message
  }
}
</script>

<style scoped src="./auth.css"></style>

