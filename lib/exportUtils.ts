import * as XLSX from 'xlsx';
import type { Parcel } from "@/types";

export function exportToExcel(parcels: Partial<Parcel>[], filename: string = 'parseller.xlsx') {
    const data = parcels.map(p => ({
        'Şehir': p.city,
        'İlçe': p.district,
        'Mahalle': p.neighborhood,
        'Ada': p.island,
        'Parsel': p.parsel,
        // Optional properties might be undefined
        'Alan (m²)': p.area || '',
        'CRM Aşaması': p.crmStage || 'NEW_LEAD',
        'Durum': p.status || 'PENDING',
        'Eklenme Tarihi': p.createdAt ? new Date(p.createdAt).toLocaleDateString('tr-TR') : '',
        'İmar Durumu': p.zoning ? 'Var' : 'Yok',
        'Enlem': p.latitude || '',
        'Boylam': p.longitude || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Parseller');

    // Auto-size columns
    const maxWidth = 50;
    const colWidths = Object.keys(data[0] || {}).map(key => {
        const maxLen = Math.max(
            key.length,
            ...data.map(row => String(row[key as keyof typeof row] || '').length)
        );
        return { wch: Math.min(maxLen + 2, maxWidth) };
    });
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, filename);
}

export function exportToCSV(parcels: Partial<Parcel>[], filename: string = 'parseller.csv') {
    const data = parcels.map(p => ({
        'Şehir': p.city,
        'İlçe': p.district,
        'Mahalle': p.neighborhood,
        'Ada': p.island,
        'Parsel': p.parsel,
        'Alan (m²)': p.area || '',
        'CRM Aşaması': p.crmStage || 'NEW_LEAD',
        'Durum': p.status || 'PENDING',
        'Eklenme Tarihi': p.createdAt ? new Date(p.createdAt).toLocaleDateString('tr-TR') : '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}
