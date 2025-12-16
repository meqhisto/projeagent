"use client";

import RegulationChat from "@/components/RegulationChat";
import { BookOpen } from "lucide-react";

export default function ResearchPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-full">
                    <BookOpen className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mevzuat ve İmar Araştırması</h1>
                    <p className="text-gray-500">Plan notlarını yükleyin ve yapay zeka destekli asistan ile yönetmelikleri sorgulayın.</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <RegulationChat />
                </div>

                <div className="space-y-6">
                    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-gray-900 mb-4">Nasıl Çalışır?</h3>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li className="flex items-start gap-2">
                                <span className="font-bold text-emerald-600">1.</span>
                                İlgili belediyenin plan notlarını veya imar yönetmeliğini PDF olarak yükleyin.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold text-emerald-600">2.</span>
                                Sistem belgeyi okur, analiz eder ve "vektör hafızasına" kaydeder.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold text-emerald-600">3.</span>
                                "Çatı arası piyes yapılabilir mi?" gibi sorular sorun.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold text-emerald-600">4.</span>
                                Asistan ilgili maddeleri bulup size getirir.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
