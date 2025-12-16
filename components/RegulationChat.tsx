"use client";

import { useState } from "react";
import { Send, Upload, FileText, Bot, Loader2 } from "lucide-react";

export default function RegulationChat() {
    const [messages, setMessages] = useState<{ role: 'user' | 'bot', content: string }[]>([
        { role: 'bot', content: 'Merhaba Mimar Bey, imar yönetmelikleri hakkında neyi merak ediyorsunuz?' }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch('http://localhost:8000/rag/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: userMsg })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, { role: 'bot', content: data.answer }]);
            } else {
                setMessages(prev => [...prev, { role: 'bot', content: 'Üzgünüm, RAG motoruna ulaşılamadı. (Bağlantı Hatası)' }]);
            }
        } catch (e) {
            setMessages(prev => [...prev, { role: 'bot', content: 'Bir hata oluştu.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];
        setUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('http://localhost:8000/rag/upload', {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                alert("Dosya başarıyla yüklendi ve sistem tarafından öğrenildi.");
            } else {
                alert("Yükleme başarısız.");
            }
        } catch (err) {
            alert("Hata oluştu.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-semibold text-gray-800">İmar Asistanı (RAG)</h3>
                </div>

                <div className="relative">
                    <input
                        type="file"
                        accept=".pdf"
                        id="plan-upload"
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                    <label
                        htmlFor="plan-upload"
                        className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${uploading ? 'bg-gray-200 text-gray-400' : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'}`}
                    >
                        {uploading ? <Loader2 className="animate-spin h-3 w-3" /> : <Upload className="h-3 w-3" />}
                        {uploading ? 'Öğreniliyor...' : 'Plan Notu Yükle'}
                    </label>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm shadow-sm whitespace-pre-wrap ${msg.role === 'user'
                                ? 'bg-emerald-600 text-white rounded-br-none'
                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 rounded-bl-none shadow-sm">
                            <Loader2 className="animate-spin h-4 w-4 text-emerald-600" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Örn: Çatı katında teras yapılabilir mi?"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
                <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
