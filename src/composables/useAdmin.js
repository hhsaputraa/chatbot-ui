import { ref } from "vue"
import { useToast } from "./useToast"
import { getAuthHeaders } from "./useAuth"

export function useAdmin() {
  const { addToast } = useToast()
  const showToast = (msg, type = 'info') => addToast ? addToast(msg, type) : console.log(msg)
  
  // State
  const isLoading = ref(false)
  const isPolling = ref(false)
  const progressLogs = ref([])
  const progressPercentage = ref(0)
  const error = ref(null)
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

  // Helper: Sleep
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  // Helper: Fetch collection count
  const getCollectionCount = async (collectionName) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/qdrant/list?collection=${collectionName}`, { headers: getAuthHeaders(), credentials: 'include' })
      if (!res.ok) return 0 // Consider empty/error as 0 or rebuilding
      const data = await res.json()
      return Array.isArray(data) ? data.length : 0
    } catch {
      return 0
    }
  }

  // Helper: Get generic count
  const getCount = async (collectionName) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/qdrant/list?collection=${collectionName}`, { headers: getAuthHeaders(), credentials: 'include' })
      if (!res.ok) return 0
      const data = await res.json()
      return Array.isArray(data) ? data.length : 0
    } catch {
      return 0
    }
  }

  const getUsers = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'GET',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      return data.data || [];
    } catch (err) {
      error.value = err.message;
      showToast(err.message, 'error');
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  const retrainSystem = async () => {
    isLoading.value = true
    isPolling.value = true
    error.value = null
    progressLogs.value = ["Memulai proses retraining RAG..."]
    progressPercentage.value = 5

    try {
      const response = await fetch(`${API_BASE_URL}/admin/retrain`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: 'include'
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      let attempts = 0
      const maxAttempts = 120 // 2 minutes max
      while (attempts < maxAttempts) {
        attempts++
        await sleep(1200)

        try {
          const statusRes = await fetch(`${API_BASE_URL}/admin/retrain/status`, {
            headers: getAuthHeaders(),
            credentials: 'include'
          })

          if (statusRes.ok) {
            const statusData = await statusRes.json()
            if (typeof statusData.percentage === 'number') {
              progressPercentage.value = Math.max(progressPercentage.value, statusData.percentage)
            }
            if (Array.isArray(statusData.logs) && statusData.logs.length > 0) {
              progressLogs.value = statusData.logs
            }
            if (!statusData.is_training && statusData.percentage >= 100) {
              break
            }
          }
        } catch (pollErr) {
          console.warn("Status poll warning:", pollErr)
        }
      }

      progressPercentage.value = 100
      progressLogs.value.push("Training selesai! Database Vektor siap.")
      return true
    } catch (err) {
      error.value = err.message
      progressLogs.value.push(`Error: ${err.message}`)
      showToast(`Gagal retraining: ${err.message}`, "error")
      throw err
    } finally {
      isLoading.value = false
      isPolling.value = false
    }
  }
  
  return {
    isLoading,
    isPolling,
    progressLogs,
    progressPercentage,
    error,
    retrainSystem,
    getUsers
  }
}
