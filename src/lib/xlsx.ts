import * as XLSX from "xlsx";

export function exportToXlsx<T>(data: T[], sheetName: string): XLSX.WorkBook {
	const ws = XLSX.utils.json_to_sheet(data);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, sheetName);
	return wb;
}
