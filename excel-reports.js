/**
 * Excel report export — company header, logo, signature placeholder, Sheet 2 chart
 * Requires: ExcelJS, Chart.js (loaded on reports.html)
 */

const REPORT_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect width="120" height="120" rx="8" fill="#1d4ed8"/>
  <text x="60" y="72" text-anchor="middle" font-family="Arial,sans-serif" font-size="42" font-weight="bold" fill="#ffffff">FR</text>
</svg>`;

function svgToPngBase64(svg, w, h) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL("image/png").split(",")[1]);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function chartImageBase64(labels, values, title, type) {
  return new Promise((resolve) => {
    const container = document.createElement("div");
    container.style.cssText = "position:fixed;left:-9999px;top:0;width:640px;height:360px;background:#fff;padding:8px;";
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    container.appendChild(canvas);
    document.body.appendChild(container);

    const palette = ["#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#f59e0b", "#22c55e", "#ef4444"];
    const chart = new Chart(canvas.getContext("2d"), {
      type: type || "bar",
      data: {
        labels,
        datasets: [{
          label: title,
          data: values,
          backgroundColor: labels.map((_, i) => palette[i % palette.length]),
          borderColor: "#1e293b",
          borderWidth: 1,
        }],
      },
      options: {
        responsive: false,
        animation: false,
        plugins: {
          title: { display: true, text: title, font: { size: 16, weight: "bold" } },
          legend: { display: type === "pie" || type === "doughnut" },
        },
        scales: type === "pie" || type === "doughnut" ? {} : {
          y: { beginAtZero: true, grid: { color: "#e2e8f0" } },
          x: { grid: { display: false } },
        },
      },
    });

    setTimeout(() => {
      resolve(canvas.toDataURL("image/png").split(",")[1]);
      chart.destroy();
      container.remove();
    }, 150);
  });
}

async function exportExcelReport(opts) {
  const {
    reportTitle,
    sheetName,
    columns,
    rows,
    signatory,
    chartLabels,
    chartValues,
    chartTitle,
    chartType,
    fileName,
  } = opts;

  const wb = new ExcelJS.Workbook();
  wb.creator = signatory?.fullName || "System";
  wb.created = new Date();

  const ws = wb.addWorksheet(sheetName || "Report", {
    views: [{ showGridLines: true }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });

  ws.getRow(1).height = 22;
  ws.getRow(2).height = 16;
  ws.getRow(3).height = 20;
  ws.getRow(4).height = 14;
  ws.getRow(5).height = 8;

  const logoB64 = await svgToPngBase64(REPORT_LOGO_SVG, 80, 80);
  const logoId = wb.addImage({ base64: logoB64, extension: "png" });
  ws.addImage(logoId, { tl: { col: 0.2, row: 0.2 }, ext: { width: 56, height: 56 } });

  ws.mergeCells("B1", "H1");
  ws.getCell("B1").value = APP_COMPANY.name;
  ws.getCell("B1").font = { size: 20, bold: true, color: { argb: "FF1D4ED8" } };
  ws.getCell("B1").alignment = { vertical: "middle" };

  ws.mergeCells("B2", "H2");
  ws.getCell("B2").value = APP_COMPANY.tagline;
  ws.getCell("B2").font = { size: 10, italic: true, color: { argb: "FF64748B" } };

  ws.mergeCells("B3", "H3");
  ws.getCell("B3").value = reportTitle;
  ws.getCell("B3").font = { size: 14, bold: true, color: { argb: "FF0F172A" } };

  ws.mergeCells("B4", "H4");
  ws.getCell("B4").value =
    "Generated: " +
    new Date().toLocaleString() +
    (signatory?.fullName ? "  |  Signatory: " + signatory.fullName + " (" + (signatory.role || "User") + ")" : "");
  ws.getCell("B4").font = { size: 9, color: { argb: "FF64748B" } };

  const startRow = 7;
  const hdrRow = ws.getRow(startRow);
  hdrRow.height = 20;
  columns.forEach((col, i) => {
    const cell = hdrRow.getCell(i + 1);
    cell.value = col.header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D4ED8" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin", color: { argb: "FF1E40AF" } },
      bottom: { style: "thin", color: { argb: "FF1E40AF" } },
      left: { style: "thin" },
      right: { style: "thin" },
    };
    ws.getColumn(i + 1).width = col.width || 16;
  });

  rows.forEach((row, ri) => {
    const r = ws.getRow(startRow + 1 + ri);
    columns.forEach((col, ci) => {
      const v = typeof col.value === "function" ? col.value(row) : row[col.key];
      const cell = r.getCell(ci + 1);
      cell.value = v ?? "";
      cell.border = {
        top: { style: "hair" },
        bottom: { style: "hair" },
        left: { style: "hair" },
        right: { style: "hair" },
      };
      if (ri % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
      }
    });
  });

  const sigRow = startRow + rows.length + 4;
  ws.mergeCells(`A${sigRow}`, `D${sigRow}`);
  ws.getCell(`A${sigRow}`).value = "Prepared by:";
  ws.getCell(`A${sigRow}`).font = { bold: true, size: 10 };

  ws.mergeCells(`A${sigRow + 1}`, `D${sigRow + 1}`);
  ws.getCell(`A${sigRow + 1}`).value = signatory?.fullName || "________________";
  ws.getCell(`A${sigRow + 1}`).font = { bold: true, size: 11 };

  ws.mergeCells(`A${sigRow + 2}`, `D${sigRow + 3}`);
  const prepSig = ws.getCell(`A${sigRow + 2}`);
  prepSig.value = (signatory?.role ? signatory.role + "\n" : "") + "_____________________________\nSignature over Printed Name";
  prepSig.alignment = { vertical: "top", wrapText: true };
  prepSig.border = { bottom: { style: "medium", color: { argb: "FF64748B" } } };

  ws.mergeCells(`F${sigRow}`, `H${sigRow}`);
  ws.getCell(`F${sigRow}`).value = "Authorized Signatory:";
  ws.getCell(`F${sigRow}`).font = { bold: true, size: 10 };

  ws.mergeCells(`F${sigRow + 1}`, `H${sigRow + 1}`);
  ws.getCell(`F${sigRow + 1}`).value = "_____________________________";
  ws.getCell(`F${sigRow + 1}`).font = { size: 11, color: { argb: "FF64748B" } };

  ws.mergeCells(`F${sigRow + 2}`, `H${sigRow + 4}`);
  const authSig = ws.getCell(`F${sigRow + 2}`);
  authSig.value = "Department Head / Supervisor\n_____________________________\nSignature over Printed Name";
  authSig.alignment = { wrapText: true, vertical: "top" };
  authSig.border = { bottom: { style: "medium", color: { argb: "FF64748B" } } };

  const ws2 = wb.addWorksheet("Sheet 2");
  ws2.mergeCells("A1", "F1");
  ws2.getCell("A1").value = reportTitle + " — Data Visualization";
  ws2.getCell("A1").font = { size: 14, bold: true, color: { argb: "FF1D4ED8" } };
  ws2.mergeCells("A2", "F2");
  ws2.getCell("A2").value = "Graph summary of exported records";
  ws2.getCell("A2").font = { size: 10, italic: true, color: { argb: "FF64748B" } };

  const chartB64 = await chartImageBase64(chartLabels, chartValues, chartTitle || reportTitle, chartType || "bar");
  const chartId = wb.addImage({ base64: chartB64, extension: "png" });
  ws2.addImage(chartId, { tl: { col: 0.5, row: 3 }, ext: { width: 560, height: 315 } });

  ws2.getCell("A20").value = "Source Data";
  ws2.getCell("A20").font = { bold: true, size: 11 };
  ws2.getCell("A21").value = "Category";
  ws2.getCell("B21").value = "Value";
  ws2.getRow(21).font = { bold: true };
  chartLabels.forEach((lb, i) => {
    ws2.getCell(`A${22 + i}`).value = lb;
    ws2.getCell(`B${22 + i}`).value = chartValues[i];
  });

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName || "report.xlsx";
  a.click();
  URL.revokeObjectURL(a.href);
}
