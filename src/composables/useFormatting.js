/**
 * Composable for data formatting utilities
 * Handles currency, datetime, and other data type formatting
 */

export function useFormatting() {
  // Currency formatter for Indonesian Rupiah
  const formatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  /**
   * Determine the type of a column based on its name
   * @param {string} colName - Column name
   * @returns {string} - Column type: 'currency', 'datetime', 'number', or 'text'
   */
  function getColumnType(colName) {
    const name = colName.toLowerCase()

    // Currency columns (IDR) - only for specific money-related keywords
    const currencyKeywords = [
      'saldo', 'debit', 'kredit', 'nominal', 'amount', 'harga', 'biaya', 'bayar','keuntungan_bank', 'keuntungan_bulan_lalu'
      // 'total' only if not followed by 'nasabah', 'penabung', 'transaksi', etc.
    ]
    for (const kw of currencyKeywords) {
      if (name.includes(kw)) return 'currency'
    }
    // 'total' as currency only if not a count
    if (name === 'total' || name === 'total_saldo' || name === 'total_nominal') return 'currency'

    // Date/time columns
    if (name.includes('tanggal') || name.includes('waktu') || name.includes('date') || name.includes('time')) {
      return 'datetime'
    }

    // Number/count columns: jumlah penabung, jumlah_nasabah, jumlah_transaksi, count, dsb
    const numberKeywords = [
      'jumlah_nasabah', 'jumlah penabung', 'jumlah_transaksi', 'jumlah transaksi', 'jumlah_nasabah', 'count', 'penabung', 'nasabah', 'transaksi', 'jumlah', 'total_nasabah', 'total_penabung', 'total_transaksi','keuntungan_bulan_lalu'
    ]
    for (const kw of numberKeywords) {
      // only match if the whole name or ends with the keyword
      if (name === kw || name.endsWith(kw)) return 'number'
    }

    // Default to text
    return 'text'
  }

  /**
   * Format a cell value based on its column type
   * @param {any} value - Cell value
   * @param {string} colName - Column name
   * @returns {string} - Formatted value
   */
  function formatCell(value, colName) {
    const type = getColumnType(colName)
    
    if (type === "currency") {
      return formatter.format(parseFloat(value) || 0)
    }
    
    if (type === "datetime") {
      const d = new Date(value)
      return isNaN(d)
        ? value
        : d.toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })
    }
    
    // type === 'number' or 'text' → display as is
    return value
  }

  /**
   * Format column header for display
   * @param {string} headerKey - Raw column name
   * @returns {string} - Formatted header
   */
  function formatHeader(headerKey) {
    if (!headerKey) return ""
    if (headerKey === "id") return "No."
    return headerKey
      .replace(/_/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase())
  }

  return {
    formatter,
    getColumnType,
    formatCell,
    formatHeader,
  }
}

