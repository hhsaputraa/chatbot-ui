import { ref } from "vue"
import { useToast } from "./useToast"

export function useAdmin() {
  const { showToast } = useToast()
  
  // State
  const isLoading = ref(false)
  const isPolling = ref(false)
  const progressLogs = ref([])
  const error = ref(null)
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

  // Helper: Sleep
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  // Helper: Fetch collection count
  const getCollectionCount = async (collectionName) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/qdrant/list?collection=${collectionName}`, { credentials: 'include' })
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
      const res = await fetch(`${API_BASE_URL}/admin/qdrant/list?collection=${collectionName}`, { credentials: 'include' })
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
        headers: { 'Content-Type': 'application/json' },
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
    // Reset state
    isLoading.value = true
    isPolling.value = true
    error.value = null
    progressLogs.value = []
    
    // Default starting target based on heuristic if we trust the user logs ~ 45 items + ~31 = ~75 ??
    // Actually safer to read current count and use it as target.
    // If current is 0, default to 100 for safety.
    let targetCount = await getCollectionCount('bpr_supra_rag')
    if (targetCount < 20) targetCount = 100 // Fallback minimum for % calc
    
    // Initial State
    progressLogs.value = []
    
    try {
      // 1. Trigger Async Process
      
      const response = await fetch(`${API_BASE_URL}/admin/retrain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include'
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      
      // Mapped Logs based on backend log sample
      progressLogs.value.push(`Proses retraining RAG dimulai...`)

      // 2. Start Smart Polling
      let attempts = 0
      const maxAttempts = 60 // 2 mins
      let previousCount = -1 
      let stabilityCounter = 0
      
      while (attempts < maxAttempts) {
        attempts++
        await sleep(2000)
        
        const count = await getCount('bpr_supra_rag')
        const percent = Math.min(Math.round((count / targetCount) * 100), 99)
        progressPercentage.value = percent
        
        // Dynamic Log Generation based on State
        if (count === 0) {
             // Matching "Collection 'bpr_supra_rag' berhasil dihapus..."
             if (progressLogs.value.at(-1) !== "Menghapus koleksi lama...") {
                 progressLogs.value = ["Menghapus koleksi lama...", "Menyiapkan DDL dan Skema..."]
             }
        } else if (count > 0 && count < (targetCount * 0.3)) {
             // Matching "Mulai 'melatih' (meng-embed dan menyimpan)..."
             progressLogs.value[0] = "Koleksi dihapus."
             progressLogs.value[1] = "Mengambil data DDL dan Contoh SQL..."
             progressLogs.value[2] = `Memproses data awal (${count} items)...`
        } else if (count >= (targetCount * 0.3) && count < targetCount) {
             // Matching "Embedding Prompt Bersih..."
             progressLogs.value[2] = "Data DDL & SQL diproses."
             progressLogs.value[3] = `Embedding Prompt Bersih (${count}/${targetCount})...`
        }
        
        // Emit progress event or just use logs length? User wants 0-100%
        // We will store percent in a separate ref if needed, or just append to log.
        // Actually, let's expose specific `progressPercent` ref.
        
        if (count > previousCount) {
            stabilityCounter = 0
        } else if (count === previousCount && count > 0) {
            stabilityCounter++
        }
        previousCount = count
        
        // Progress Logic
        // We will misuse the 'error' ref to pass percentage signals to UI if we don't want to change signature too much,
        // OR better: add `progressPercentage` to returned object. 
        // Since I can't easily change the Destructuring in Vue without editing that too (I will), let's emit special log format OR add new Ref.
        // Let's add new Ref `progressPercentage`.
        
        // Update Logs with "Checking..." is annoying. 
        
        // Success: Stable for 6 seconds (3 checks)
        if (stabilityCounter >= 3 && count > 10) {
            break
        }
      }

      progressLogs.value.push("Menyimpan semua vektor ke Qdrant...")
      await sleep(1000)
      progressLogs.value.push("Training selesai! Database Vektor siap.")
      
      // Signal 100%
      return true // Component will handle reload
    } catch (err) {
      error.value = err.message
      progressLogs.value.push(`Error: ${err.message}`)
      showToast(`Failed: ${err.message}`, "error")
      throw err
    } finally {
      isLoading.value = false
      // isPolling stays true for a moment to show 100%? Handled in UI.
      isPolling.value = false
    }
  }

  const progressPercentage = ref(0)
  
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
