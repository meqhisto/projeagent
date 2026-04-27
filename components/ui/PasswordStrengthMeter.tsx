"use client";

import { useState } from "react";

interface PasswordStrength {
    score: number; // 0-4
    label: string;
    color: string;
}

export default function PasswordStrengthMeter({ password }: { password: string }) {
    const calculateStrength = (pwd: string): PasswordStrength => {
        if (!pwd) {
            return { score: 0, label: "", color: "bg-gray-200" };
        }

        let score = 0;

        // Length
        if (pwd.length >= 8) score++;
        if (pwd.length >= 12) score++;

        // Complexity
        if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++; // Mixed case
        if (/\d/.test(pwd)) score++; // Numbers
        if (/[^a-zA-Z0-9]/.test(pwd)) score++; // Special chars

        // Cap at 4
        score = Math.min(score, 4);

        const levels = [
            { score: 0, label: "", color: "bg-gray-200" },
            { score: 1, label: "Çok Zayıf", color: "bg-red-500" },
            { score: 2, label: "Zayıf", color: "bg-orange-500" },
            { score: 3, label: "Orta", color: "bg-yellow-500" },
            { score: 4, label: "Güçlü", color: "bg-green-500" }
        ];

        return levels[score];
    };

    const strength = calculateStrength(password);

    if (!password) return null;

    return (
        <div className="mt-2">
            <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((level) => (
                    <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${level <= strength.score ? strength.color : "bg-gray-200"
                            }`}
                    />
                ))}
            </div>
            <p className={`text-xs font-medium ${strength.score === 1 ? "text-red-600" :
                    strength.score === 2 ? "text-orange-600" :
                        strength.score === 3 ? "text-yellow-600" :
                            strength.score === 4 ? "text-green-600" :
                                "text-gray-400"
                }`}>
                {strength.label}
            </p>
        </div>
    );
}
