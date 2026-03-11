import ExcelJS from "exceljs";

// -------- MAIN EXPORT FUNCTION FOR ORG LEVEL ----------
export const exportOrgDashboardExcel = async (
    rows: any[],
    orgName: string
) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Org Dashboard");

    // -------- columns ----------
    sheet.columns = [
        { header: "Record ID", key: "record_id", width: 38 },
        { header: "Environment Name", key: "environment_name", width: 35 },
        { header: "Flow Session ID", key: "flow_session_id", width: 38 },
        { header: "Bot Start Time", key: "bot_start_time", width: 22 },
        { header: "Bot End Time", key: "bot_end_time", width: 22 },
        { header: "Run Duration (ms)", key: "run_duration", width: 18 },
        { header: "Machine Name", key: "machine_name", width: 22 },
        { header: "Bot Name", key: "bot_name", width: 30 },
        { header: "RAM Usage %", key: "ram_usage_percent", width: 15 },
        { header: "CPU Usage %", key: "cpu_usage_percentage", width: 15 },
        { header: "Trigger Type", key: "trigger_type", width: 15 },
        { header: "Status", key: "status", width: 15 },
        { header: "Error Message", key: "error_message", width: 35 },
        { header: "Machine Group", key: "machine_group", width: 20 },
        { header: "Created On", key: "created_on", width: 22 },
        { header: "Created By", key: "created_by", width: 15 },
        { header: "Source", key: "source", width: 15 },
        { header: "00-01", key: "hour_00_01", width: 10 },
        { header: "01-02", key: "hour_01_02", width: 10 },
        { header: "02-03", key: "hour_02_03", width: 10 },
        { header: "03-04", key: "hour_03_04", width: 10 },
        { header: "04-05", key: "hour_04_05", width: 10 },
        { header: "05-06", key: "hour_05_06", width: 10 },
        { header: "06-07", key: "hour_06_07", width: 10 },
        { header: "07-08", key: "hour_07_08", width: 10 },
        { header: "08-09", key: "hour_08_09", width: 10 },
        { header: "09-10", key: "hour_09_10", width: 10 },
        { header: "10-11", key: "hour_10_11", width: 10 },
        { header: "11-12", key: "hour_11_12", width: 10 },
        { header: "12-13", key: "hour_12_13", width: 10 },
        { header: "13-14", key: "hour_13_14", width: 10 },
        { header: "14-15", key: "hour_14_15", width: 10 },
        { header: "15-16", key: "hour_15_16", width: 10 },
        { header: "16-17", key: "hour_16_17", width: 10 },
        { header: "17-18", key: "hour_17_18", width: 10 },
        { header: "18-19", key: "hour_18_19", width: 10 },
        { header: "19-20", key: "hour_19_20", width: 10 },
        { header: "20-21", key: "hour_20_21", width: 10 },
        { header: "21-22", key: "hour_21_22", width: 10 },
        { header: "22-23", key: "hour_22_23", width: 10 },
        { header: "23-24", key: "hour_23_24", width: 10 },
    ];

    // -------- rows ----------
    rows.forEach((row) => {
        sheet.addRow({
            record_id: row.record_id ?? "",
            environment_name: row.environment_name ?? "",
            flow_session_id: row.flow_session_id ?? "",
            bot_start_time: row.bot_start_time ?? "",
            bot_end_time: row.bot_end_time ?? "",
            run_duration: row.run_duration ?? "",
            machine_name: row.machine_name ?? "",
            bot_name: row.bot_name ?? "",
            ram_usage_percent: row.ram_usage_percent ?? "",
            cpu_usage_percentage: row.cpu_usage_percentage ?? "",
            trigger_type: row.trigger_type ?? "",
            status: row.status ?? "",
            error_message: row.error_message ?? "",
            machine_group: row.machine_group ?? "",
            created_on: row.created_on ?? "",
            created_by: row.created_by ?? "",
            source: row.source ?? "",
            hour_00_01: row["[00-01]"] ?? "",
            hour_01_02: row["[01-02]"] ?? "",
            hour_02_03: row["[02-03]"] ?? "",
            hour_03_04: row["[03-04]"] ?? "",
            hour_04_05: row["[04-05]"] ?? "",
            hour_05_06: row["[05-06]"] ?? "",
            hour_06_07: row["[06-07]"] ?? "",
            hour_07_08: row["[07-08]"] ?? "",
            hour_08_09: row["[08-09]"] ?? "",
            hour_09_10: row["[09-10]"] ?? "",
            hour_10_11: row["[10-11]"] ?? "",
            hour_11_12: row["[11-12]"] ?? "",
            hour_12_13: row["[12-13]"] ?? "",
            hour_13_14: row["[13-14]"] ?? "",
            hour_14_15: row["[14-15]"] ?? "",
            hour_15_16: row["[15-16]"] ?? "",
            hour_16_17: row["[16-17]"] ?? "",
            hour_17_18: row["[17-18]"] ?? "",
            hour_18_19: row["[18-19]"] ?? "",
            hour_19_20: row["[19-20]"] ?? "",
            hour_20_21: row["[20-21]"] ?? "",
            hour_21_22: row["[21-22]"] ?? "",
            hour_22_23: row["[22-23]"] ?? "",
            hour_23_24: row["[23-24]"] ?? "",
        });
    });

    // -------- make header bold ----------
    sheet.getRow(1).font = { bold: true };

    // -------- generate & download ----------
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Org_Dashboard_report_${orgName || "Organization"}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
};
