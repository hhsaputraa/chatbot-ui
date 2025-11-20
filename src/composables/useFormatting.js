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

    // Currency columns (IDR) - expanded detection
    if (
      name.includes("saldo") ||
      name.includes("debit") ||
      name.includes("kredit") ||
      name.includes("total") ||
      name.includes("masuk") ||
      name.includes("keluar") ||
      name.includes("jumlah") ||
      name.includes("nominal") ||
      name.includes("amount") ||
      name.includes("harga") ||
      name.includes("biaya") ||
      name.includes("bayar")
    ) {
      return "currency"
    }

    // Date/time columns
    if (name.includes("tanggal") || name.includes("waktu") || name.includes("date") || name.includes("time")) {
      return "datetime"
    }

    // Special number column
    if (name === "jumlah_nasabah") {
      return "number"
    }

    // Default to text
    return "text"
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

