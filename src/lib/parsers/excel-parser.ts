import ExcelJS from "exceljs";
import { Readable } from "stream";

export interface ExcelParseResult {
  rows: string[][];
  sheetName: string;
}

export async function parseExcel(buffer: Buffer): Promise<ExcelParseResult> {
  const workbook = new ExcelJS.Workbook();

  // Create a readable stream from the buffer
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  await workbook.xlsx.read(stream);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return { rows: [], sheetName: "" };
  }

  const rows: string[][] = [];

  worksheet.eachRow((row) => {
    const rowData: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      // Handle different cell value types
      let value = "";
      if (cell.value !== null && cell.value !== undefined) {
        if (typeof cell.value === "object" && "text" in cell.value) {
          // Rich text
          value = String(cell.value.text);
        } else if (typeof cell.value === "object" && "result" in cell.value) {
          // Formula result
          value = String(cell.value.result ?? "");
        } else {
          value = String(cell.value);
        }
      }
      rowData.push(value.trim());
    });
    rows.push(rowData);
  });

  const nonEmptyRows = rows.filter((row) => row.some((cell) => cell.length > 0));

  return {
    rows: nonEmptyRows,
    sheetName: worksheet.name,
  };
}
