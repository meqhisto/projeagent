"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { exportToExcel, exportToCSV } from "@/lib/exportUtils";

interface ExportButtonProps {
    parcels: any[];
    disabled?: boolean;
}

export default function ExportButton({ parcels, disabled = false }: ExportButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleExportExcel = () => {
        exportToExcel(parcels, `parseller_${new Date().toISOString().split('T')[0]}.xlsx`);
        setIsOpen(false);
    };

    const handleExportCSV = () => {
        exportToCSV(parcels, `parseller_${new Date().toISOString().split('T')[0]}.csv`);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled || parcels.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <Download className="h-4 w-4" />
                Dışa Aktar
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                        <button
                            onClick={handleExportExcel}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <FileSpreadsheet className="h-4 w-4 text-green-600" />
                            <div className="text-left">
                                <div className="font-medium">Excel</div>
                                <div className="text-xs text-gray-500">.xlsx formatı</div>
                            </div>
                        </button>
                        <div className="border-t border-gray-100" />
                        <button
                            onClick={handleExportCSV}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-b-lg"
                        >
                            <FileText className="h-4 w-4 text-blue-600" />
                            <div className="text-left">
                                <div className="font-medium">CSV</div>
                                <div className="text-xs text-gray-500">.csv formatı</div>
                            </div>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
