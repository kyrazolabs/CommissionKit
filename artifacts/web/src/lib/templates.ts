import * as XLSX from "xlsx";

export function downloadTemplate(type: "csv" | "xlsx") {
  const data = [
    ["Rep Email", "Deal Name", "Amount", "Currency", "Close Date", "Stage", "Notes"],
    [
      "jane@example.com",
      "Acme Corp Q3",
      50000,
      "USD",
      "2023-09-15",
      "closed_won",
      "Enterprise deal",
    ],
    [
      "john@example.com",
      "Globex Expansion",
      25000,
      "SAR",
      "2023-09-20",
      "closed_won",
      "SMB expansion",
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Deals Template");

  if (type === "xlsx") {
    XLSX.writeFile(wb, "CommissionKit_Deals_Template.xlsx");
  } else {
    // For CSV, we can use the same utility but specify bookType
    XLSX.writeFile(wb, "CommissionKit_Deals_Template.csv", { bookType: "csv" });
  }
}
