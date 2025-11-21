<script setup>
import { ref, onMounted } from "vue"
import DataTable from "../../components/DataTable.vue"

const placeholderData = ref({
  columns: [
    "query_id",
    "original_query",
    "improved_query",
    "improvement_type",
    "confidence_score",
    "created_at",
  ],
  rows: [
    [
      1,
      "tampilkan nasabah",
      "SELECT * FROM nasabah ORDER BY created_at DESC LIMIT 10",
      "Query Expansion",
      0.95,
      "2025-01-14 10:30:00",
    ],
    [
      2,
      "saldo besar",
      "SELECT * FROM nasabah WHERE saldo > 10000000 ORDER BY saldo DESC",
      "Ambiguity Resolution",
      0.88,
      "2025-01-14 10:32:15",
    ],
    [
      3,
      "transaksi kemarin",
      "SELECT * FROM transaksi WHERE DATE(tanggal_transaksi) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)",
      "Temporal Clarification",
      0.92,
      "2025-01-14 10:35:42",
    ],
    [
      4,
      "nasabah aktif",
      "SELECT * FROM nasabah WHERE status = 'aktif' AND last_transaction_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)",
      "Context Enhancement",
      0.87,
      "2025-01-14 10:38:20",
    ],
    [
      5,
      "total saldo",
      "SELECT SUM(saldo) as total_saldo, COUNT(*) as jumlah_nasabah FROM nasabah WHERE status = 'aktif'",
      "Aggregation Addition",
      0.91,
      "2025-01-14 10:40:55",
    ],
    [
      6,
      "transaksi besar",
      "SELECT * FROM transaksi WHERE jumlah > 5000000 ORDER BY jumlah DESC LIMIT 20",
      "Threshold Definition",
      0.85,
      "2025-01-14 10:43:10",
    ],
    [
      7,
      "nasabah baru",
      "SELECT * FROM nasabah WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) ORDER BY created_at DESC",
      "Temporal Clarification",
      0.89,
      "2025-01-14 10:45:33",
    ],
    [
      8,
      "rekening premium",
      "SELECT * FROM nasabah WHERE jenis_rekening = 'premium' OR saldo > 50000000",
      "Category Expansion",
      0.93,
      "2025-01-14 10:48:05",
    ],
    [
      9,
      "transaksi gagal",
      "SELECT * FROM transaksi WHERE status = 'failed' ORDER BY tanggal_transaksi DESC LIMIT 15",
      "Status Clarification",
      0.9,
      "2025-01-14 10:50:22",
    ],
    [
      10,
      "nasabah tidak aktif",
      "SELECT * FROM nasabah WHERE status = 'inactive' OR last_transaction_date < DATE_SUB(CURDATE(), INTERVAL 90 DAY)",
      "Inactivity Definition",
      0.86,
      "2025-01-14 10:52:48",
    ],
    [
      11,
      "top 5 nasabah",
      "SELECT * FROM nasabah ORDER BY saldo DESC LIMIT 5",
      "Ranking Query",
      0.94,
      "2025-01-14 10:55:12",
    ],
    [
      12,
      "transaksi hari ini",
      "SELECT * FROM transaksi WHERE DATE(tanggal_transaksi) = CURDATE() ORDER BY tanggal_transaksi DESC",
      "Temporal Clarification",
      0.96,
      "2025-01-14 10:57:30",
    ],
  ],
})

// reactive table state (initialized from placeholder)
const columns = ref(placeholderData.value.columns)
const rows = ref(placeholderData.value.rows)

const messageIndex = ref(0)

const loading = ref(false)
const error = ref(null)
const activeCollection = ref("bpr_supra_rag")
const rawData = ref([])

// modal / action state
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedId = ref(null)
const editForm = ref({})
const lastActionMessage = ref("")
const saveLoading = ref(false)
// simple local toast notifications
const toasts = ref([])
function showToast(message, type = "success", timeout = 3500) {
  const id = Date.now() + Math.random()
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, timeout)
}

async function fetchCollection(collection) {
  loading.value = true
  error.value = null
  activeCollection.value = collection
  try {
    const url = `http://localhost:8097/admin/qdrant/list?collection=${collection}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()

    rawData.value = data

    if (collection === "bpr_supra_rag") {
      // Expect payload: { category, content, prompt_preview }
      columns.value = ["id", "category", "prompt_preview", "content", "action"]
      rows.value = data.map(item => [
        item.id,
        item.payload?.category ?? "",
        item.payload?.prompt_preview ?? "",
        item.payload?.content ?? "",
        "",
      ])
    } else if (collection === "bpr_supra_cache") {
      // Expect payload: { prompt_asli, sql_query }
      columns.value = ["id", "prompt_asli", "sql_query", "action"]
      rows.value = data.map(item => [
        item.id,
        item.payload?.prompt_asli ?? "",
        item.payload?.sql_query ?? "",
        "",
      ])
    } else {
      // Generic fallback: try to flatten payload keys
      if (Array.isArray(data) && data.length > 0) {
        const sample = data[0]
        const payloadKeys = sample.payload ? Object.keys(sample.payload) : []
        columns.value = ["id", ...payloadKeys, "action"]
        rows.value = data.map(item => [
          item.id,
          ...payloadKeys.map(k => item.payload?.[k] ?? ""),
          "",
        ])
      } else {
        columns.value = ["id"]
        rows.value = []
      }
    }
  } catch (err) {
    error.value = String(err)
    console.error("fetchCollection error", err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // load RAG by default
  fetchCollection("bpr_supra_rag")
})

function openEditModal(id) {
  selectedId.value = id
  const item = rawData.value.find(i => i.id === id)
  if (item && item.payload) {
    if (activeCollection.value === "bpr_supra_rag") {
      editForm.value = {
        category: item.payload.category ?? "",
        prompt_preview: item.payload.prompt_preview ?? "",
        content: item.payload.content ?? "",
      }
    } else if (activeCollection.value === "bpr_supra_cache") {
      editForm.value = {
        prompt_asli: item.payload.prompt_asli ?? "",
        sql_query: item.payload.sql_query ?? "",
      }
    } else {
      // generic shallow copy
      editForm.value = { ...(item.payload || {}) }
    }
  } else {
    // fallback: try to find in rows
    const row = rows.value.find(r => r[0] === id)
    editForm.value = {}
    if (row) {
      // map remaining columns to form fields
      columns.value.forEach((col, idx) => {
        if (col !== "id" && col !== "action") editForm.value[col] = row[idx]
      })
    }
  }
  showEditModal.value = true
}

function openDeleteModal(id) {
  selectedId.value = id
  showDeleteModal.value = true
}

function saveEdit() {
  // Prepare payload according to example
  const payloadBase = {
    collection: activeCollection.value,
    id: selectedId.value,
  }

  if (activeCollection.value === "bpr_supra_cache") {
    const payload = {
      ...payloadBase,
      prompt: editForm.value.prompt_asli ?? "",
      sql: editForm.value.sql_query ?? "",
    }

    // send update to backend
    saveLoading.value = true
    error.value = null
    fetch("http://localhost:8097/admin/qdrant/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async res => {
        if (!res.ok) {
          const txt = await res.text()
          throw new Error(`HTTP ${res.status} ${txt}`)
        }
        return res.json().catch(() => ({}))
      })
      .then(resp => {
        // Update local UI: update rawData and rows
        const idx = rawData.value.findIndex(i => i.id === selectedId.value)
        if (idx !== -1) {
          rawData.value[idx].payload = rawData.value[idx].payload || {}
          rawData.value[idx].payload.prompt_asli =
            editForm.value.prompt_asli ?? rawData.value[idx].payload.prompt_asli
          rawData.value[idx].payload.sql_query =
            editForm.value.sql_query ?? rawData.value[idx].payload.sql_query

          // also update rows array (id at index 0)
          const rowIdx = rows.value.findIndex(r => r[0] === selectedId.value)
          if (rowIdx !== -1) {
            // columns for cache are ["id","prompt_asli","sql_query","action"]
            // keep action placeholder as empty string so DataTable renders action buttons
            rows.value[rowIdx] = [
              selectedId.value,
              rawData.value[idx].payload.prompt_asli,
              rawData.value[idx].payload.sql_query,
              "",
            ]
          }
        }

        lastActionMessage.value = `Update successful for ${payload.collection} id=${payload.id}`
        showEditModal.value = false
        showToast("Update saved successfully", "success")
      })
      .catch(err => {
        console.error("Update error", err)
        error.value = String(err)
        lastActionMessage.value = `Update failed: ${err}`
        showToast("Update failed: " + String(err), "error")
      })
      .finally(() => {
        saveLoading.value = false
      })

    return
  }

  // other collections: prepare payload but don't automatically POST
  const payload = { ...payloadBase }
  if (activeCollection.value === "bpr_supra_rag") {
    // map prompt_preview -> prompt, content -> sql/content
    payload.prompt = editForm.value.prompt_preview ?? ""
    payload.content = editForm.value.content ?? ""
    payload.category = editForm.value.category ?? ""
  } else {
    Object.assign(payload, editForm.value)
  }

  console.log("Prepared update payload:", payload)
  lastActionMessage.value = `Prepared update for ${payload.collection} id=${payload.id}`
  // close modal
  showEditModal.value = false
}

function updateEditFormFromJSON(e) {
  try {
    const v = JSON.parse(e.target.value)
    editForm.value = v
  } catch (err) {}
}

function confirmDelete() {
  const payload = { collection: activeCollection.value, id: selectedId.value }
  console.log("Prepared delete payload:", payload)
  rawData.value = rawData.value.filter(i => i.id !== selectedId.value)
  rows.value = rows.value.filter(r => r[0] !== selectedId.value)
  lastActionMessage.value = `Deleted ${payload.collection} id=${payload.id}`
  showDeleteModal.value = false
}
</script>

<template>
  <div class="improve-query-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-content">
        <router-link to="/" class="back-button">
          <svg
            class="icon"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Kembali ke Chat
        </router-link>
        <h1 class="page-title">
          <svg
            class="title-icon"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
            />
          </svg>
          Improve Query
        </h1>
        <p class="page-description">
          Lihat riwayat perbaikan query dan saran optimasi dari AI
        </p>
      </div>
    </header>

    <!-- Main Content -->
    <main class="page-content">
      <div class="content-wrapper">
        <!-- Data Table -->
        <div class="table-section">
          <h2 class="section-title">Riwayat Query Improvement</h2>

          <div
            class="collection-controls"
            style="
              margin-bottom: 12px;
              display: flex;
              gap: 8px;
              align-items: center;
            "
          >
            <button
              :disabled="loading || activeCollection === 'bpr_supra_rag'"
              @click.prevent="fetchCollection('bpr_supra_rag')"
              :class="{ active: activeCollection === 'bpr_supra_rag' }"
              :aria-pressed="activeCollection === 'bpr_supra_rag'"
            >
              Load RAG
            </button>
            <button
              :disabled="loading || activeCollection === 'bpr_supra_cache'"
              @click.prevent="fetchCollection('bpr_supra_cache')"
              :class="{ active: activeCollection === 'bpr_supra_cache' }"
              :aria-pressed="activeCollection === 'bpr_supra_cache'"
            >
              Load CACHE
            </button>
            <span
              v-if="loading"
              style="margin-left: 8px; color: var(--text-muted)"
              >Loading...</span
            >
            <span v-if="error" style="margin-left: 8px; color: var(--danger)"
              >Error: {{ error }}</span
            >
          </div>

          <DataTable
            :message-index="messageIndex"
            :rows="rows"
            :columns="columns"
            :reset-key="activeCollection"
            :keep-height="true"
            @edit-row="openEditModal"
            @delete-row="openDeleteModal"
          />

          <!-- Edit Modal -->
          <div v-if="showEditModal" class="modal-backdrop">
            <div class="modal-card">
              <h3>Edit Item</h3>
              <div v-if="activeCollection === 'bpr_supra_rag'">
                <label>Category</label>
                <input v-model="editForm.category" />
                <label>Prompt Preview</label>
                <textarea v-model="editForm.prompt_preview" rows="3"></textarea>
                <label>Content</label>
                <textarea v-model="editForm.content" rows="6"></textarea>
              </div>
              <div v-else-if="activeCollection === 'bpr_supra_cache'">
                <label>Prompt Asli</label>
                <textarea v-model="editForm.prompt_asli" rows="3"></textarea>
                <label>SQL Query</label>
                <textarea v-model="editForm.sql_query" rows="6"></textarea>
              </div>
              <div v-else>
                <label>Payload (JSON)</label>
                <textarea
                  :value="JSON.stringify(editForm, null, 2)"
                  @input="updateEditFormFromJSON"
                  rows="6"
                ></textarea>
              </div>
              <div
                style="
                  margin-top: 12px;
                  display: flex;
                  gap: 8px;
                  justify-content: flex-end;
                "
              >
                <button @click="showEditModal = false" :disabled="saveLoading">
                  Cancel
                </button>
                <button @click="saveEdit" :disabled="saveLoading">
                  {{ saveLoading ? "Saving..." : "Save" }}
                </button>
              </div>
            </div>
          </div>

          <!-- Delete Modal -->
          <div v-if="showDeleteModal" class="modal-backdrop">
            <div class="modal-card">
              <h3>Confirm Delete</h3>
              <p>
                Are you sure you want to delete id: {{ selectedId }} from
                {{ activeCollection }}?
              </p>
              <div
                style="
                  margin-top: 12px;
                  display: flex;
                  gap: 8px;
                  justify-content: flex-end;
                "
              >
                <button @click="showDeleteModal = false">Cancel</button>
                <button @click="confirmDelete">Delete</button>
              </div>
            </div>
          </div>

          <div
            v-if="lastActionMessage"
            style="margin-top: 8px; color: var(--text-muted)"
          >
            {{ lastActionMessage }}
          </div>
          <!-- Toast container -->
          <div class="toast-container">
            <div v-for="t in toasts" :key="t.id" class="toast" :class="t.type">
              {{ t.message }}
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped src="./style.css"></style>
