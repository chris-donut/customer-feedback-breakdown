import * as XLSX from "xlsx";

export interface ExcelParseResult {
  rows: string[][];
  sheetName: string;
}

export async function parseExcel(buffer: Buffer): Promise<ExcelParseResult> {
  const workbook = XLSX.read(buffer, { type: "buffer" });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return { rows: [], sheetName: "" };
  }

  const worksheet = workbook.Sheets[firstSheetName];
  if (!worksheet) {
    return { rows: [], sheetName: firstSheetName };
  }

  const rawData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
  });

  const rows: string[][] = rawData.map((row) =>
    row.map((cell) => String(cell ?? "").trim())
  );

  const nonEmptyRows = rows.filter((row) => row.some((cell) => cell.length > 0));

  return {
    rows: nonEmptyRows,
    sheetName: firstSheetName,
  };
}
