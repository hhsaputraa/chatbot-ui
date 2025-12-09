import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// Shared state across all components
const currentUser = ref(null)
const authToken = ref(null)
const isAuthenticated = computed(() => !!authToken.value)

/**
 * Authentication composable for managing user authentication
 * Provides login, register, logout, and token management
 */
export function useAuth() {
  const router = useRouter()

  /**
   * Initialize auth state from localStorage on app load
   */
  function initAuth() {
    const token = localStorage.getItem('jwt_token')
    const user = localStorage.getItem('user_data')
    
    if (token) {
      authToken.value = token
      try {
        currentUser.value = user ? JSON.parse(user) : null
      } catch (e) {
        console.error('Failed to parse user data:', e)
        clearAuth()
      }
    }
  }

  /**
   * Login user with username and password
   * @param {string} username - User's username
   * @param {string} password - User's password
   * @returns {Promise<{success: boolean, message: string, user?: object}>}
   */
  async function login(username, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          message: data.message || data.error || 'Login gagal. Periksa username dan password Anda.'
        }
      }

      // Store token and user data
      const token = data.data?.token || data.token || data.access_token || data.jwt
const user = data.data?.user || data.user || { username }

      if (!token) {
        return {
          success: false,
          message: 'Token tidak ditemukan dalam respons server.'
        }
      }

      authToken.value = token
      currentUser.value = user
      localStorage.setItem('jwt_token', token)
      localStorage.setItem('user_data', JSON.stringify(user))

      return {
        success: true,
        message: 'Login berhasil!',
        user
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        message: error.message.includes('fetch') 
          ? 'Gagal terhubung ke server. Pastikan backend sudah berjalan.'
          : 'Terjadi kesalahan saat login. Silakan coba lagi.'
      }
    }
  }

  /**
   * Register new user
   * @param {object} userData - User registration data
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async function register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          message: data.message || data.error || 'Registrasi gagal. Silakan coba lagi.'
        }
      }

      return {
        success: true,
        message: data.message || 'Registrasi berhasil! Silakan login.'
      }
    } catch (error) {
      console.error('Register error:', error)
      return {
        success: false,
        message: error.message.includes('fetch')
          ? 'Gagal terhubung ke server. Pastikan backend sudah berjalan.'
          : 'Terjadi kesalahan saat registrasi. Silakan coba lagi.'
      }
    }
  }

  /**
   * Logout user and clear auth state
   */
  function logout() {
    clearAuth()
    router.push('/login')
  }

  /**
   * Clear authentication state
   */
  function clearAuth() {
    authToken.value = null
    currentUser.value = null
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('user_data')
  }

  /**
   * Get authorization headers for API requests
   * @returns {object} Headers object with Authorization
   */
  function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' }
    if (authToken.value) {
      headers['Authorization'] = `Bearer ${authToken.value}`
    }
    return headers
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  function checkAuth() {
    return isAuthenticated.value
  }

  return {
    // State
    currentUser,
    authToken,
    isAuthenticated,
    
    // Methods
    initAuth,
    login,
    register,
    logout,
    clearAuth,
    getAuthHeaders,
    checkAuth
  }
}

