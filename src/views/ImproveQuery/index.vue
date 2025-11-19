<script setup>
import { ref } from "vue"
import DataTable from "../../components/DataTable.vue"

// NOTE: This is placeholder content. Will be connected to API endpoint in the future.
// TODO: Connect to backend API for query improvement functionality

// Mock/Dummy data untuk demonstrasi layout dan styling
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

const messageIndex = 0 // Dummy message index untuk pagination
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
        <!-- Info Banner -->
        <div class="info-banner">
          <svg
            class="info-icon"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
            />
          </svg>
          <div class="info-text">
            <strong>Catatan:</strong> Ini adalah konten placeholder. Fitur ini
            akan terhubung ke API endpoint di masa mendatang untuk menampilkan
            data query improvement yang sebenarnya.
          </div>
        </div>

        <!-- Data Table -->
        <div class="table-section">
          <h2 class="section-title">Riwayat Query Improvement</h2>
          <DataTable
            :message-index="messageIndex"
            :rows="placeholderData.rows"
            :columns="placeholderData.columns"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped src="./style.css"></style>
