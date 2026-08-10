# Smart Multi-Tier Column Formatting Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded & toggle-based currency formatting in Vue frontend with a scalable, 4-tier pattern classification & runtime value inspector engine.

**Architecture:** 
1. `src/composables/useFormatting.js`: Pattern-based column type matcher & runtime value auto-inspector.
2. `src/components/DataTable.vue`: Remove manual checkbox toggle & integrate smart formatter.
3. `src/composables/useTablePagination.js`: Remove deprecated boolean formatting flag.

**Tech Stack:** Vue 3, Composition API, JavaScript Intl API, Vite.

---

### Task 1: Refactor `useFormatting.js` Engine

**Files:**
- Modify: `chatbot-ui/src/composables/useFormatting.js`

**Interfaces:**
- Produces: `getColumnType(colName, sampleValue)` and `formatCell(value, colName)`

- [ ] **Step 1: Update `useFormatting.js` with regex patterns & value inspector**

```javascript
export function useFormatting() {
  const rupiahFormatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  const numberFormatter = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  const ID_PATTERN = /^(id|kode|kd|no|ref|idx|nik|kpo|kol|status|tahun|bulan|kodepos|telepon|phone)$/i
  const ID_AFFIX_PATTERN = /^(id_|kode_|kd_|no_|ref_)|(_id|_kode|_kd|_no|_nik|_ref|_pk|_fk)$/i

  const COUNT_PATTERN = /^(jumlah|count|qty|quantity|total_nasabah|total_transaksi|total_orang|total_unit|total_penabung|persen|percentage|pct|ratio|rate)$/i
  const COUNT_AFFIX_PATTERN = /(_count|_qty|_jumlah|_nasabah|_transaksi|_unit|_orang)$/i

  const CURRENCY_PATTERN = /^(saldo|bunga|debit|kredit|nominal|amount|harga|biaya|bayar|pendapatan|omset|omzet|denda|angsuran|pokok|margin|laba|rugi|asset|ekuitas|modal|plafond|limit|tagihan|fee|cashback|diskon|tunggakan|total_saldo|total_nominal|total_pendapatan|total_bunga|total_kredit)$/i
  const CURRENCY_AFFIX_PATTERN = /(_saldo|_nominal|_bunga|_biaya|_harga|_pendapatan|_plafond|_tunggakan)$/i

  const DATE_PATTERN = /^(tanggal|waktu|date|time|created_at|updated_at|tgl_)/i
  const DATE_AFFIX_PATTERN = /(_date|_tgl|_at|_time)$/i

  function getColumnType(colName, value = null) {
    if (!colName) return 'text'
    const name = String(colName).trim().toLowerCase()

    // 1. Explicit ID / Code Check (NEVER Currency)
    if (ID_PATTERN.test(name) || ID_AFFIX_PATTERN.test(name)) {
      return 'id'
    }

    // 2. Date / Time Check
    if (DATE_PATTERN.test(name) || DATE_AFFIX_PATTERN.test(name)) {
      return 'datetime'
    }

    // 3. Count / Quantity Check (NEVER Currency)
    if (COUNT_PATTERN.test(name) || COUNT_AFFIX_PATTERN.test(name)) {
      return 'count'
    }

    // 4. Currency Check
    if (CURRENCY_PATTERN.test(name) || CURRENCY_AFFIX_PATTERN.test(name)) {
      return 'currency'
    }

    // 5. Value Auto-Inspection for Ambiguous Columns (e.g. 'februari', 'nilai', 'total')
    if (value !== null && value !== undefined && value !== "") {
      const num = Number(value)
      if (!isNaN(num)) {
        // Year or small integer < 100 -> Count / ID
        if (Number.isInteger(num) && (num < 100 || (num >= 1900 && num <= 2100))) {
          return 'count'
        }
        // Numbers >= 1000 or decimals -> Currency
        if (num >= 1000 || !Number.isInteger(num)) {
          return 'currency'
        }
      }
    }

    return 'text'
  }

  function formatCell(value, colName) {
    if (value === null || value === undefined || value === "") {
      return "-"
    }

    const type = getColumnType(colName, value)

    if (type === "datetime") {
      const d = new Date(value)
      return isNaN(d.getTime()) ? value : d.toISOString().split('T')[0]
    }

    if (type === "id") {
      return String(value)
    }

    const num = parseFloat(value)
    if (isNaN(num)) {
      return String(value)
    }

    if (type === "currency") {
      return rupiahFormatter.format(num)
    }

    if (type === "count") {
      return numberFormatter.format(num)
    }

    return String(value)
  }

  function formatHeader(headerKey) {
    if (!headerKey) return ""
    if (headerKey === "id") return "No."
    return headerKey
      .replace(/_/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase())
  }

  return {
    rupiahFormatter,
    numberFormatter,
    getColumnType,
    formatCell,
    formatHeader,
  }
}
```

---

### Task 2: Clean Up `DataTable.vue` & `useTablePagination.js`

**Files:**
- Modify: `chatbot-ui/src/components/DataTable.vue`
- Modify: `chatbot-ui/src/composables/useTablePagination.js`

- [ ] **Step 1: Remove checkbox toggle & update `formatCellAdapter` in `DataTable.vue`**
- [ ] **Step 2: Update `useTablePagination.js` signatures**

---

### Task 3: Verification & Build Check

- [ ] **Step 1: Run Vite build check for `chatbot-ui`**
