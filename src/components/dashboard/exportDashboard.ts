import ExcelJS from "exceljs";

// -------- helper: safely parse stringified JSON (backend returns strings) ----------
const safeParse = (val: any): any => {
  if (!val || typeof val !== "string") return val ?? null;
  try {
    return JSON.parse(val);
  } catch {
    try {
      return JSON.parse(
        val
          .replace(/'/g, '"')
          .replace(/\bNone\b/g, "null")
          .replace(/\bTrue\b/g, "true")
          .replace(/\bFalse\b/g, "false")
      );
    } catch {
      return null;
    }
  }
};

// -------- helper: get first input file (supports .files[] and .uploaded_files[]) ----------
const getInputFile = (rawInputData: any) => {
  const inputData = safeParse(rawInputData);
  const firstGroup = inputData?.input_files?.[0];
  return firstGroup?.files?.[0] ?? firstGroup?.uploaded_files?.[0] ?? null;
};

// -------- helper: get first output file ----------
const getOutputFile = (rawOutputData: any) => {
  const outputData = safeParse(rawOutputData);
  return outputData?.output_files?.[0]?.files?.[0] ?? null;
};

// -------- helper: apply hyperlink style ----------
const applyHyperlinkStyle = (cell: ExcelJS.Cell) => {
  cell.font = { color: { argb: "0563C1" }, underline: true };
};

// -------- helper: style header row ----------
const styleHeader = (sheet: ExcelJS.Worksheet) => {
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "EFF6FF" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 20;
};

// ============================================================
// 1️⃣  BOT-LEVEL EXPORT  (getBotExecutionLog)
//     Fields: bot_code, list_param, created_by
//             input_data / output_data may be null (INITIATED)
// ============================================================
export const exportBotDashboardExcel = async (rows: any[], botName: string) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Bot Dashboard");

  sheet.columns = [
    { header: "Bot Execution ID", key: "bot_execution_id", width: 28 },
    { header: "Bot Code",         key: "bot_code",         width: 20 },
    { header: "File Name",        key: "lp_file_name",     width: 35 },
    { header: "ETA",              key: "lp_eta",           width: 22 },
    { header: "Created On",       key: "created_on",       width: 22 },
    { header: "Created By",       key: "created_by",       width: 35 },
    { header: "Machine Name",     key: "machine_name",     width: 22 },
    { header: "Bot Start Time",   key: "bot_start_time",   width: 22 },
    { header: "Bot End Time",     key: "bot_end_time",     width: 22 },
    { header: "Bot Status",       key: "bot_status",       width: 15 },
    { header: "Bot Fail Reason",  key: "bot_fail_reason",  width: 35 },
    { header: "Input File",       key: "input_file",       width: 50 },
    { header: "Output File",      key: "output_file",      width: 50 },
  ];

  rows.forEach((row) => {
    const input  = getInputFile(row.input_data);
    const output = getOutputFile(row.output_data);

    const newRow = sheet.addRow({
      bot_execution_id: row.bot_execution_id  ?? "",
      bot_code:         row.bot_code          ?? "",
      lp_file_name:     row.list_param?.file_name ?? "",
      lp_eta:           row.list_param?.ETA        ?? "",
      created_on:       row.created_on        ?? "",
      created_by:       row.created_by        ?? "",
      machine_name:     row.machine_name      ?? "",
      bot_start_time:   row.bot_start_time    ?? "",
      bot_end_time:     row.bot_end_time      ?? "",
      bot_status:       row.bot_status        ?? "",
      bot_fail_reason:  row.bot_fail_reason   ?? "",
      input_file: input?.file_name
        ? { text: input.file_name, hyperlink: String(input.file_path ?? "").replace(/\\/g, "/") }
        : "",
      output_file: output?.file_name
        ? { text: output.file_name, hyperlink: String(output.file_path ?? "").replace(/\\/g, "/") }
        : "",
    });

    if (input?.file_name)  applyHyperlinkStyle(newRow.getCell("input_file"));
    if (output?.file_name) applyHyperlinkStyle(newRow.getCell("output_file"));
  });

  styleHeader(sheet);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Bot_Report_${botName || "Bot"}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

// ============================================================
// 2️⃣  CATEGORY-LEVEL EXPORT  (getBotCategoryExecutionLog)
//     Fields: bot_name, bot_code, list_param, created_by
//             input_data / output_data are stringified JSON
// ============================================================
export const exportCategoryDashboardExcel = async (rows: any[], categoryName: string) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Category Dashboard");

  sheet.columns = [
    { header: "Bot Execution ID", key: "bot_execution_id", width: 28 },
    { header: "Bot Name",         key: "bot_name",         width: 28 },
    { header: "Bot Code",         key: "bot_code",         width: 20 },
    { header: "File Name",        key: "lp_file_name",     width: 35 },
    { header: "ETA",              key: "lp_eta",           width: 22 },
    { header: "Created On",       key: "created_on",       width: 22 },
    { header: "Created By",       key: "created_by",       width: 35 },
    { header: "Machine Name",     key: "machine_name",     width: 22 },
    { header: "Bot Start Time",   key: "bot_start_time",   width: 22 },
    { header: "Bot End Time",     key: "bot_end_time",     width: 22 },
    { header: "Bot Status",       key: "bot_status",       width: 15 },
    { header: "Bot Fail Reason",  key: "bot_fail_reason",  width: 35 },
    { header: "Input File",       key: "input_file",       width: 50 },
    { header: "Output File",      key: "output_file",      width: 50 },
  ];

  rows.forEach((row) => {
    const input  = getInputFile(row.input_data);
    const output = getOutputFile(row.output_data);

    const newRow = sheet.addRow({
      bot_execution_id: row.bot_execution_id  ?? "",
      bot_name:         row.bot_name          ?? "",
      bot_code:         row.bot_code          ?? "",
      lp_file_name:     row.list_param?.file_name ?? "",
      lp_eta:           row.list_param?.ETA        ?? "",
      created_on:       row.created_on        ?? "",
      created_by:       row.created_by        ?? "",
      machine_name:     row.machine_name      ?? "",
      bot_start_time:   row.bot_start_time    ?? "",
      bot_end_time:     row.bot_end_time      ?? "",
      bot_status:       row.bot_status        ?? "",
      bot_fail_reason:  row.bot_fail_reason   ?? "",
      input_file: input?.file_name
        ? { text: input.file_name, hyperlink: String(input.file_path ?? "").replace(/\\/g, "/") }
        : "",
      output_file: output?.file_name
        ? { text: output.file_name, hyperlink: String(output.file_path ?? "").replace(/\\/g, "/") }
        : "",
    });

    if (input?.file_name)  applyHyperlinkStyle(newRow.getCell("input_file"));
    if (output?.file_name) applyHyperlinkStyle(newRow.getCell("output_file"));
  });

  styleHeader(sheet);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Category_Report_${categoryName || "Category"}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

// -------- keep old export alias for any other callers ----------
export const exportDashboardExcel = exportBotDashboardExcel;
