<template>
  <div class="auth-container">
    <div class="auth-card">
      <!-- Logo/Header -->
      <div class="auth-header">
        <div class="logo-icon">
          <Icon icon="mdi:account-plus" width="48" height="48" />
        </div>
        <h1 class="auth-title">Buat Akun Baru</h1>
        <p class="auth-subtitle">Daftar untuk menggunakan BPR Supra Chatbot</p>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="error-banner">
        <Icon icon="mdi:alert-circle" width="20" height="20" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Register Form -->
      <form @submit.prevent="handleRegister" class="auth-form">
        <!-- Full Name Field -->
        <div class="form-group">
          <label for="fullname" class="form-label">
            <Icon icon="mdi:account-circle" width="18" height="18" />
            Nama Lengkap
          </label>
          <input
            id="fullname"
            v-model="formData.fullname"
            type="text"
            class="form-input"
            placeholder="Masukkan nama lengkap"
            required
            :disabled="isLoading"
          />
        </div>

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
            @blur="validateUsername"
          />
          <span v-if="validationErrors.username" class="field-error">
            {{ validationErrors.username }}
          </span>
        </div>

        <!-- Email Field -->
        <div class="form-group">
          <label for="email" class="form-label">
            <Icon icon="mdi:email" width="18" height="18" />
            Email
          </label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            class="form-input"
            placeholder="Masukkan email"
            required
            autocomplete="email"
            :disabled="isLoading"
            @blur="validateEmail"
          />
          <span v-if="validationErrors.email" class="field-error">
            {{ validationErrors.email }}
          </span>
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
              autocomplete="new-password"
              :disabled="isLoading"
              @blur="validatePassword"
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
          <span v-if="validationErrors.password" class="field-error">
            {{ validationErrors.password }}
          </span>
        </div>

        <!-- Confirm Password Field -->
        <div class="form-group">
          <label for="confirmPassword" class="form-label">
            <Icon icon="mdi:lock-check" width="18" height="18" />
            Konfirmasi Password
          </label>
          <div class="password-input-wrapper">
            <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="Masukkan ulang password"
              required
              autocomplete="new-password"
              :disabled="isLoading"
              @blur="validateConfirmPassword"
            />
            <button
              type="button"
              class="password-toggle"
              @click="showConfirmPassword = !showConfirmPassword"
              :disabled="isLoading"
            >
              <Icon
                :icon="showConfirmPassword ? 'mdi:eye-off' : 'mdi:eye'"
                width="20"
                height="20"
              />
            </button>
          </div>
          <span v-if="validationErrors.confirmPassword" class="field-error">
            {{ validationErrors.confirmPassword }}
          </span>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="submit-btn"
          :disabled="isLoading || !isFormValid"
        >
          <Icon
            v-if="isLoading"
            icon="mdi:loading"
            width="20"
            height="20"
            class="spin"
          />
          <Icon v-else icon="mdi:account-plus" width="20" height="20" />
          <span>{{ isLoading ? "Memproses..." : "Daftar" }}</span>
        </button>
      </form>

      <!-- Login Link -->
      <div class="auth-footer">
        <p>
          Sudah punya akun?
          <router-link to="/login" class="auth-link">Login di sini</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { useRouter } from "vue-router"
import { Icon } from "@iconify/vue"
import { useAuth } from "../../composables/useAuth"

const router = useRouter()
const { register, isAuthenticated } = useAuth()

const formData = ref({
  fullname: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
})

const validationErrors = ref({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref("")

// Check if already logged in
onMounted(() => {
  if (isAuthenticated.value) {
    router.push("/")
  }
})

// Form validation
const isFormValid = computed(() => {
  return (
    formData.value.fullname.trim() &&
    formData.value.username.trim() &&
    formData.value.email.trim() &&
    formData.value.password &&
    formData.value.confirmPassword &&
    !validationErrors.value.username &&
    !validationErrors.value.email &&
    !validationErrors.value.password &&
    !validationErrors.value.confirmPassword
  )
})

function validateUsername() {
  const username = formData.value.username.trim()
  if (username.length < 3) {
    validationErrors.value.username = "Username minimal 3 karakter"
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    validationErrors.value.username =
      "Username hanya boleh huruf, angka, dan underscore"
  } else {
    validationErrors.value.username = ""
  }
}

function validateEmail() {
  const email = formData.value.email.trim()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    validationErrors.value.email = "Format email tidak valid"
  } else {
    validationErrors.value.email = ""
  }
}

function validatePassword() {
  const password = formData.value.password
  if (password.length < 6) {
    validationErrors.value.password = "Password minimal 6 karakter"
  } else {
    validationErrors.value.password = ""
  }
  // Re-validate confirm password if it's already filled
  if (formData.value.confirmPassword) {
    validateConfirmPassword()
  }
}

function validateConfirmPassword() {
  if (formData.value.password !== formData.value.confirmPassword) {
    validationErrors.value.confirmPassword = "Password tidak cocok"
  } else {
    validationErrors.value.confirmPassword = ""
  }
}

async function handleRegister() {
  // Validate all fields
  validateUsername()
  validateEmail()
  validatePassword()
  validateConfirmPassword()

  if (!isFormValid.value) {
    errorMessage.value = "Mohon perbaiki kesalahan pada form"
    return
  }

  errorMessage.value = ""
  isLoading.value = true

  const { confirmPassword, ...userData } = formData.value
  const result = await register(userData)

  isLoading.value = false

  if (result.success) {
    // Redirect to login with success message
    router.push({ path: "/login", query: { registered: "true" } })
  } else {
    errorMessage.value = result.message
  }
}
</script>

<style scoped src="./auth.css"></style>
