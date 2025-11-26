<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue"
import { Icon } from "@iconify/vue"
import DataTable from "../../components/DataTable.vue"

const handleScroll = () => {
  const header = document.querySelector(".sticky-header")
  if (window.scrollY > 50) {
    header?.classList.add("scrolled")
  } else {
    header?.classList.remove("scrolled")
  }
}

onMounted(() => {
  window.addEventListener("scroll", handleScroll)
})

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll)
})

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

const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedId = ref(null)
const editForm = ref({})
const lastActionMessage = ref("")
const saveLoading = ref(false)
const sqlTextarea = ref(null)
const editModalRef = ref(null)
const copySql = async () => {
  try {
    await navigator.clipboard.writeText(editForm.value.sql_query || "")
    showToast("SQL berhasil disalin!", "success")
  } catch (err) {
    showToast("Gagal menyalin SQL: " + String(err), "error")
  }
}
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
      columns.value = ["id", "category", "prompt_preview", "content", "action"]
      rows.value = data.map(item => [
        item.id,
        item.payload?.category ?? "",
        item.payload?.prompt_preview ?? "",
        item.payload?.content ?? "",
        "",
      ])
    } else if (collection === "bpr_supra_cache") {
      columns.value = ["id", "prompt_asli", "sql_query", "action"]
      rows.value = data.map(item => [
        item.id,
        item.payload?.prompt_asli ?? "",
        item.payload?.sql_query ?? "",
        "",
      ])
    } else {
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
  fetchCollection("bpr_supra_rag")
})

function openEditModal(id) {
  console.log("openEditModal -> id:", id)
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
      editForm.value = { ...(item.payload || {}) }
    }
  } else {
    const row = rows.value.find(r => r[0] === id)
    editForm.value = {}
    if (row) {
      columns.value.forEach((col, idx) => {
        if (col !== "id" && col !== "action") editForm.value[col] = row[idx]
      })
    }
  }
  showEditModal.value = true
}

function openDeleteModal(id) {
  console.log("openDeleteModal -> id:", id)
  selectedId.value = id
  showDeleteModal.value = true
}

// Add new cache item state
const showAddModal = ref(false)
const addForm = ref({ prompt: "", sql: "" })
const addLoading = ref(false)
const deleteLoading = ref(false)

function openAddModal() {
  addForm.value = { prompt: "", sql: "" }
  showAddModal.value = true
}

async function createCacheEntry() {
  if (!addForm.value.prompt.trim() || !addForm.value.sql.trim()) {
    showToast("Prompt dan SQL tidak boleh kosong", "error")
    return
  }

  addLoading.value = true

  try {
    const res = await fetch("http://localhost:8097/admin/cache/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: addForm.value.prompt.trim(),
        sql: addForm.value.sql.trim(),
      }),
    })

    if (!res.ok) {
      let backendMsg = ""
      try {
        const errData = await res.json()
        backendMsg = errData.error || errData.message || ""
      } catch (e) {
        backendMsg = await res.text()
      }

      let userFriendlyMessage = ""

      if (res.status === 400 && backendMsg.includes("SQL Ditolak")) {
        userFriendlyMessage = `
          Silakan perbaiki query Anda.
        `
      } else if (res.status === 400 && backendMsg.includes("kosong")) {
        userFriendlyMessage = "Mohon lengkapi Prompt dan SQL sebelum menyimpan."
      } else if (res.status === 500) {
        userFriendlyMessage = `
          Terjadi masalah saat memproses data.
          Silakan coba lagi beberapa saat lagi.
        `
      } else {
        userFriendlyMessage = backendMsg || `Terjadi kesalahan (${res.status})`
      }
      throw new Error(userFriendlyMessage)
    }

    const data = await res.json()

    const newId = data.id || data._id || `temp-${Date.now()}`
    const newItem = {
      id: newId,
      payload: {
        prompt_asli: addForm.value.prompt.trim(),
        sql_query: addForm.value.sql.trim(),
      },
    }

    rawData.value.unshift(newItem)
    rows.value.unshift([
      newId,
      addForm.value.prompt.trim(),
      addForm.value.sql.trim(),
      "",
    ])

    showToast("Cache berhasil ditambahkan!", "success", 4000)
    showAddModal.value = false
    await fetchCollection("bpr_supra_cache").catch(() => {})
  } catch (err) {
    console.error("Create cache error:", err)

    let userMessage = ""
    let title = "Gagal menambah cache"

    if (
      err.name === "TypeError" &&
      (err.message.includes("Failed to fetch") ||
        err.message.includes("network"))
    ) {
      if (!navigator.onLine) {
        userMessage = `
          Tidak ada koneksi internet.
          Pastikan Perangkat Anda terhubung ke internet.
        `
        title = "Anda Offline"
      } else {
        userMessage = `
          Tidak dapat menghubungi server
        `
        title = "Server Unreachable"
      }
    } else if (err.name === "TypeError" && err.message.includes("fetch")) {
      userMessage = `
      Tidak dapat terhubung ke server
      Pastikan service sedang berjalan
      Atau coba refresh halaman ini.
    `
    } else if (
      err.message?.includes("Server error") ||
      err.message?.includes("Bad Request")
    ) {
      userMessage = `
      Gagal menyimpan ke server,
      ${err.message}
    `
    } else {
      userMessage = `Terjadi kesalahan: ${err.message || "Unknown error"}`
    }
    showToast(userMessage, "error", 10000)
  } finally {
    addLoading.value = false
  }
}

async function saveEdit() {
  const payloadBase = {
    collection: activeCollection.value,
    id: selectedId.value,
  }

  if (activeCollection.value === "bpr_supra_cache") {
    const promptVal = editForm.value.prompt_asli?.trim() ?? ""
    const sqlVal = editForm.value.sql_query?.trim() ?? ""

    if (!promptVal || !sqlVal) {
      showToast("Prompt dan SQL tidak boleh kosong", "error")
      return
    }

    saveLoading.value = true
    error.value = null

    try {
      const payload = {
        ...payloadBase,
        prompt: promptVal,
        sql: sqlVal,
      }
      const res = await fetch("http://localhost:8097/admin/qdrant/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        let backendMsg = ""
        try {
          const errData = await res.json()
          backendMsg = errData.error || errData.message || ""
        } catch (e) {
          backendMsg = await res.text()
        }
        let userFriendlyMessage = ""
        if (res.status === 400 && backendMsg.includes("SQL Ditolak")) {
          userFriendlyMessage = `
            Update dibatalkan.Silahkan ganti query anda
          `
        } else if (res.status === 400) {
          userFriendlyMessage = `Gagal Update: ${backendMsg}`
        } else if (res.status === 500) {
          userFriendlyMessage = `
            Terjadi masalah saat memproses data.
          Silakan coba lagi beberapa saat lagi.
          `
        } else {
          userFriendlyMessage = backendMsg || `HTTP Error ${res.status}`
        }

        throw new Error(userFriendlyMessage)
      }
      const idx = rawData.value.findIndex(i => i.id === selectedId.value)
      if (idx !== -1) {
        rawData.value[idx].payload = rawData.value[idx].payload || {}
        rawData.value[idx].payload.prompt_asli = promptVal
        rawData.value[idx].payload.sql_query = sqlVal
        const rowIdx = rows.value.findIndex(r => r[0] === selectedId.value)
        if (rowIdx !== -1) {
          rows.value[rowIdx] = [
            selectedId.value,
            promptVal,
            sqlVal,
            rows.value[rowIdx][3] || "",
          ]
        }
      }

      showEditModal.value = false
      showToast("✅ Update berhasil disimpan!", "success", 3000)
    } catch (err) {
      console.error("Update error", err)
      error.value = String(err)

      let finalMessage = ""

      if (
        err.name === "TypeError" &&
        (err.message.includes("fetch") || err.message.includes("network"))
      ) {
        if (!navigator.onLine) {
          finalMessage = `
              Tidak ada koneksi internet.
          Pastikan Perangkat Anda terhubung ke internet.
            `
        } else {
          finalMessage = `
             Tidak dapat menghubungi server
            `
        }
      } else {
        finalMessage = err.message
      }

      showToast(finalMessage, "error", 6000)
    } finally {
      saveLoading.value = false
    }

    return
  }

  const payload = { ...payloadBase }
  if (activeCollection.value === "bpr_supra_rag") {
    payload.prompt = editForm.value.prompt_preview ?? ""
    payload.content = editForm.value.content ?? ""
    payload.category = editForm.value.category ?? ""
  } else {
    Object.assign(payload, editForm.value)
  }

  console.log("Prepared update payload:", payload)

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
  if (activeCollection.value === "bpr_supra_cache") {
    deleteLoading.value = true
    fetch("http://localhost:8097/admin/qdrant/delete", {
      method: "DELETE",
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
        rawData.value = rawData.value.filter(i => i.id !== selectedId.value)
        rows.value = rows.value.filter(r => r[0] !== selectedId.value)
        showToast("Delete successful", "success")
        showDeleteModal.value = false
      })
      .catch(err => {
        console.error("Delete error", err)
        showToast("Delete failed: " + String(err), "error")
      })
      .finally(() => {
        deleteLoading.value = false
      })
  } else {
    rawData.value = rawData.value.filter(i => i.id !== selectedId.value)
    rows.value = rows.value.filter(r => r[0] !== selectedId.value)
    showDeleteModal.value = false
  }
}
watch(showAddModal, async val => {
  if (val) {
    addForm.value = { prompt: "", sql: "" }
    await nextTick()
    document.querySelector("#prompt")?.focus()
  }
})
watch(showEditModal, async val => {
  if (val) {
    await nextTick()
    sqlTextarea.value?.$el?.focus?.() || sqlTextarea.value?.focus?.()
    const len = editForm.value.sql_query?.length || 0
    sqlTextarea.value?.$el?.setSelectionRange?.(len, len)
    sqlTextarea.value?.setSelectionRange?.(len, len)
  }
})
</script>

<template>
  <div class="improve-query-page">
    <!-- Header -->
    <header class="sticky-header">
      <div class="header-inner">
        <!-- Tombol Kembali - pojok kiri -->
        <router-link to="/" class="back-button">
          <Icon icon="solar:arrow-left-linear" class="icon" />
          Kembali ke Chat
        </router-link>

        <!-- Judul + deskripsi - tengah -->
        <div class="header-title">
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
            Improve Knowledge
          </h1>
          <p class="page-description">
            Lihat dari berbagai sumber data pengetahuan AI
          </p>
        </div>

        <!-- Kosongin kanan biar seimbang -->
        <div class="header-right"></div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="page-content">
      <div class="content-wrapper">
        <!-- Data Table -->
        <div class="table-section">
          <h2 class="section-title">Data Pengetahuan</h2>

          <div class="collection-controls">
            <div class="controls-left">
              <button
                :disabled="loading || activeCollection === 'bpr_supra_rag'"
                @click.prevent="fetchCollection('bpr_supra_rag')"
                :class="{ active: activeCollection === 'bpr_supra_rag' }"
                class="switch-btn"
              >
                Load RAG
              </button>
              <button
                :disabled="loading || activeCollection === 'bpr_supra_cache'"
                @click.prevent="fetchCollection('bpr_supra_cache')"
                :class="{ active: activeCollection === 'bpr_supra_cache' }"
                class="switch-btn"
              >
                Load CACHE
              </button>
              <span v-if="loading" class="loading-text">Loading...</span>
            </div>

            <button
              v-if="activeCollection === 'bpr_supra_cache'"
              @click.prevent="openAddModal"
              :disabled="addLoading"
              class="add-item-btn"
            >
              <Icon icon="solar:add-circle-bold" class="add-icon" />
              Add Item
            </button>
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
          <!-- EDIT CACHE ENTRY MODAL — PREMIUM & KONSISTEN -->
          <teleport to="body">
            <div
              v-if="showEditModal"
              class="modal-overlay"
              @click="showEditModal = false"
            >
              <div
                class="modal-container"
                @click.stop
                @keydown.esc="showEditModal = false"
                tabindex="0"
                ref="editModalRef"
              >
                <div class="modal-header">
                  <h2 class="modal-title">
                    <Icon icon="solar:pen-bold" class="title-icon edit" />
                    Edit Cache Entry
                  </h2>
                  <button
                    @click="showEditModal = false"
                    class="close-btn"
                    aria-label="Tutup"
                  >
                    <Icon icon="solar:close-circle-bold" />
                  </button>
                </div>

                <div class="modal-body">
                  <!-- Prompt Asli -->
                  <div class="form-group">
                    <label>Prompt Asli</label>
                    <textarea
                      v-model="editForm.prompt_asli"
                      rows="4"
                      class="input-textarea"
                      placeholder="Prompt dalam bahasa natural..."
                    ></textarea>
                  </div>

                  <!-- SQL Query -->
                  <div class="form-group">
                    <label>SQL Query</label>
                    <textarea
                      v-model="editForm.sql_query"
                      rows="10"
                      class="input-textarea sql-input"
                      placeholder="SELECT ... FROM ..."
                      ref="sqlTextarea"
                    ></textarea>
                    <div class="action-bar">
                      <button
                        @click="copySql"
                        class="copy-btn"
                        title="Copy SQL"
                      >
                        <Icon icon="solar:copy-bold" />
                        Copy SQL
                      </button>
                    </div>
                  </div>
                </div>

                <div class="modal-footer">
                  <button
                    @click="showEditModal = false"
                    class="btn-secondary"
                    :disabled="saveLoading"
                  >
                    Batal
                  </button>
                  <button
                    @click="saveEdit"
                    class="btn-primary"
                    :disabled="
                      saveLoading ||
                      !editForm.prompt_asli?.trim() ||
                      !editForm.sql_query?.trim()
                    "
                  >
                    <span v-if="!saveLoading"> Simpan Perubahan </span>
                    <span v-else>
                      <Icon icon="solar:refresh-bold" class="spin" />
                      Menyimpan...
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </teleport>

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
                <button
                  @click="showDeleteModal = false"
                  :disabled="deleteLoading"
                >
                  Cancel
                </button>
                <button @click="confirmDelete" :disabled="deleteLoading">
                  {{ deleteLoading ? "Deleting..." : "Delete" }}
                </button>
              </div>
            </div>
          </div>

          <teleport to="body">
            <div
              v-if="showAddModal"
              class="modal-overlay"
              @click="showAddModal = false"
            >
              <div
                class="modal-container"
                @click.stop
                @keydown.esc="showAddModal = false"
                tabindex="0"
                ref="modalRef"
              >
                <div class="modal-header">
                  <h2 class="modal-title">
                    <Icon icon="solar:add-circle-bold" class="title-icon" />
                    Tambah Cache Query Baru
                  </h2>
                  <button
                    @click="showAddModal = false"
                    class="close-btn"
                    aria-label="Tutup"
                  >
                    <Icon icon="solar:close-circle-bold" />
                  </button>
                </div>

                <div class="modal-body">
                  <div class="form-group">
                    <label for="prompt">Prompt Asli (Natural Language)</label>
                    <textarea
                      id="prompt"
                      v-model="addForm.prompt"
                      rows="4"
                      placeholder="Contoh: tampilkan 10 nasabah dengan saldo terbesar"
                      class="input-textarea"
                      required
                    ></textarea>
                  </div>

                  <div class="form-group">
                    <label for="sql">SQL Query (Hasil Terjemahan)</label>
                    <textarea
                      id="sql"
                      v-model="addForm.sql"
                      rows="8"
                      placeholder="SELECT nama_lengkap, saldo FROM bpr_supra_nasabah ORDER BY saldo DESC LIMIT 10;"
                      class="input-textarea sql-input"
                      required
                    ></textarea>
                    <small class="hint">
                      Pastikan query valid dan sesuai
                    </small>
                  </div>
                </div>

                <div class="modal-footer">
                  <button
                    @click="showAddModal = false"
                    class="btn-secondary"
                    :disabled="addLoading"
                  >
                    Batal
                  </button>
                  <button
                    @click="createCacheEntry"
                    class="btn-primary"
                    :disabled="
                      !addForm.prompt.trim() ||
                      !addForm.sql.trim() ||
                      addLoading
                    "
                  >
                    <span v-if="!addLoading"> Buat Cache Entry </span>
                    <span v-else>
                      <Icon icon="solar:refresh-bold" class="spin" />
                      Membuat...
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </teleport>
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
