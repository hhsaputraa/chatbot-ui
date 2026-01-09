import { jsPDF } from "jspdf";
import "jspdf-autotable";

/**
 * Composable for handling Data Table Exports
 */
export function useDataExport() {
  
  /**
   * Export data to CSV
   * @param {Object} options
   * @param {Array} options.headers - Array of header strings
   * @param {Array} options.body - 2D Array of string values
   * @param {String} filename - Output filename
   */
  function exportToCSV({ headers, body }, filename = "export_data.csv") {
    // Gabungkan header
    let csvContent = headers.join(",") + "\n";

    // Gabungkan body
    body.forEach((row) => {
      // Pastikan nilai yang mengandung koma dibungkus tanda kutip
      const escapedRow = row.map(
        (cell) => `"${String(cell).replace(/"/g, '""')}"`
      );
      csvContent += escapedRow.join(",") + "\n";
    });

    // Buat Blob dan picu download
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    
    triggerDownload(blob, filename);
  }

  /**
   * Export data to PDF (v1 - AutoTable)
   */
  async function exportToPDF({ headers, body }, filename = "export_data.pdf") {
    try {
      const doc = new jsPDF({
        orientation: "landscape",
      });

      const tableOptions = {
        head: [headers],
        body: body,
        startY: 20,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: "bold",
        },
      };

      // Try to use autoTable attached to the doc first, otherwise dynamic import the plugin
      if (typeof doc.autoTable === "function") {
        doc.autoTable(tableOptions);
      } else {
        // dynamic import as fallback (works with ESM builds)
        const at = await import("jspdf-autotable");
        if (at && typeof at.default === "function") {
          try {
            at.default(doc, tableOptions);
          } catch (e) {
            if (typeof doc.autoTable === "function") doc.autoTable(tableOptions);
            else throw e;
          }
        } else if (typeof doc.autoTable === "function") {
          doc.autoTable(tableOptions);
        } else {
          throw new Error("jspdf-autotable plugin not available");
        }
      }

      doc.text("Laporan Data", 14, 15);
      doc.save(filename);
    } catch (err) {
      console.error("exportToPDF error:", err);
      throw new Error("Gagal mengekspor PDF: " + (err.message || String(err)));
    }
  }

  /**
   * Export data to PDF (v2 - PDFMake)
   */
  async function exportToPDFv2({ headers, body }, filename = "export_data_v2.pdf") {
    try {
      // dynamic import pdfmake to avoid bundling issues
      const pdfMakeModule = await import("pdfmake/build/pdfmake");
      const pdfFonts = await import("pdfmake/build/vfs_fonts");

      const pdfMake =
        pdfMakeModule && pdfMakeModule.default
          ? pdfMakeModule.default
          : pdfMakeModule;

      if (pdfFonts && (pdfFonts.pdfMake || pdfFonts.vfs)) {
        if (pdfFonts.pdfMake && pdfFonts.pdfMake.vfs)
          pdfMake.vfs = pdfFonts.pdfMake.vfs;
        else if (pdfFonts.vfs) pdfMake.vfs = pdfFonts.vfs;
      }

      const tableBody = [headers, ...body];

      const dd = {
        content: [
          { text: "Laporan Data", style: "header" },
          { text: "\n" },
          {
            style: "tableExample",
            table: {
              headerRows: 1,
              body: tableBody,
            },
            layout: "lightHorizontalLines",
          },
        ],
        styles: {
          header: { fontSize: 16, bold: true, margin: [0, 0, 0, 8] },
          tableExample: { margin: [0, 5, 0, 15] },
          tableHeader: { bold: true, fontSize: 11, color: "black" },
        },
        defaultStyle: { fontSize: 9 },
      };

      pdfMake.createPdf(dd).download(filename);
    } catch (err) {
      console.error("exportToPDFv2 error:", err);
      throw new Error("Gagal mengekspor PDF v2: " + (err.message || String(err)));
    }
  }

  // Internal Helper
  function triggerDownload(blob, filename) {
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return {
    exportToCSV,
    exportToPDF,
    exportToPDFv2
  };
}
