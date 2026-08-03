"use client";

import ExcelJS from "exceljs";

export interface ListExcelRow {
  no: number;
  tanggal: string;
  deskripsi: string;
  noKwitansi: string;
  jenis: string;
  subJenis: string;
  kodeTrx: string;
  namaAnggota: string;
  nominal: number;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function exportListExcel(rows: ListExcelRow[], label: string) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Pencatatan");

  ws.addRow([`Pencatatan`]).font = { bold: true, size: 13 };
  ws.addRow([]);

  ws.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Tanggal", key: "tanggal", width: 14 },
    { header: "Deskripsi", key: "deskripsi", width: 32 },
    { header: "No Kwitansi", key: "noKwitansi", width: 16 },
    { header: "Jenis", key: "jenis", width: 18 },
    { header: "Sub Jenis", key: "subJenis", width: 28 },
    { header: "Kode Trx", key: "kodeTrx", width: 12 },
    { header: "Nama Anggota", key: "namaAnggota", width: 22 },
    { header: "Nominal", key: "nominal", width: 18 },
  ];

  ws.getRow(3).eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF2F2" } };
  });

  for (const row of rows) {
    ws.addRow(row);
  }

  const totalNominal = rows.reduce((s, r) => s + r.nominal, 0);

  ws.addRow([]);
  ws.addRow([
    "",
    "TOTAL",
    "",
    "",
    "",
    "",
    "",
    "",
    totalNominal,
  ]).font = { bold: true };

  const buf = await wb.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `pencatatan-${label.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}
