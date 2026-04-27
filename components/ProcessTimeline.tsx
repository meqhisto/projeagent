"use client";

import { useMemo } from "react";
import { Check, Circle, Clock, ArrowRight } from "lucide-react";

const STAGES = [
    { id: "NEW_LEAD", label: "Fırsat", description: "Yeni potansiyel yer" },
    { id: "ANALYSIS", label: "Analiz", description: "İmar ve fizibilite" },
    { id: "OFFER_SENT", label: "Teklif", description: "Mal sahibine sunuldu" },
    { id: "NEGOTIATION", label: "Pazarlık", description: "Şartlar görüşülüyor" },
    { id: "CONTRACT", label: "Sözleşme", description: "Noter aşaması" },
    { id: "PROJECT", label: "Proje", description: "Ruhsat ve çizim" },
    { id: "CONSTRUCTION", label: "İnşaat", description: "Yapım süreci" },
];

export default function ProcessTimeline({ currentStage, onStageChange }: { currentStage: string, onStageChange?: (stage: string) => void }) {

    // Determine index
    const currentIndex = useMemo(() => {
        return STAGES.findIndex(s => s.id === currentStage);
    }, [currentStage]);

    return (
        <div className="w-full bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6 overflow-x-auto">
            <div className="flex items-center justify-between min-w-[800px]">
                {STAGES.map((stage, index) => {
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    const isFuture = index > currentIndex;

                    return (
                        <div key={stage.id} className="flex-1 flex flex-col items-center relative group cursor-pointer" onClick={() => onStageChange && onStageChange(stage.id)}>

                            {/* Connecting Line (Right) */}
                            {index !== STAGES.length - 1 && (
                                <div className={`absolute top-4 left-1/2 w-full h-1 z-0 ${isCompleted ? 'bg-[#0071e3]' : 'bg-gray-100'}`}></div>
                            )}

                            {/* Circle Node */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 transition-all duration-300 ${isCompleted ? 'bg-[#0071e3] border-[#0071e3] text-white' :
                                    isCurrent ? 'bg-white border-purple-600 text-purple-600 ring-4 ring-purple-100' :
                                        'bg-white border-gray-300 text-gray-300'
                                }`}>
                                {isCompleted ? <Check className="w-4 h-4" /> :
                                    isCurrent ? <Clock className="w-4 h-4 animate-pulse" /> :
                                        <Circle className="w-4 h-4" />}
                            </div>

                            {/* Text Info */}
                            <div className="mt-3 text-center">
                                <span className={`text-xs font-bold block ${isCurrent ? 'text-purple-700' : isCompleted ? 'text-[#0077ed]' : 'text-gray-400'}`}>
                                    {stage.label}
                                </span>
                                <span className="text-[10px] text-gray-400 hidden group-hover:block transition-all absolute top-full w-32 left-1/2 -translate-x-1/2 mt-1 bg-gray-800 text-white p-1 rounded z-20">
                                    {stage.description}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
