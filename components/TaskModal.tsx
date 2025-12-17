"use client";

import { useState, useEffect } from "react";
import { X, Calendar, User, Tag, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    taskId?: number;
    defaultParcelId?: number;
}

interface Parcel {
    id: number;
    city: string;
    district: string;
    island: string;
    parsel: string;
}

interface Customer {
    id: number;
    name: string;
    role: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

export default function TaskModal({ isOpen, onClose, onSuccess, taskId, defaultParcelId }: TaskModalProps) {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [parcels, setParcels] = useState<Parcel[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        content: "",
        parcelId: defaultParcelId || "",
        customerId: "",
        assignedTo: "",
        priority: "MEDIUM",
        dueDate: "",
        tags: ""
    });

    const [errors, setErrors] = useState<any>({});

    useEffect(() => {
        if (isOpen) {
            fetchData();
            if (taskId) {
                fetchTask();
            }
        }
    }, [isOpen, taskId]);

    const fetchData = async () => {
        try {
            const [parcelsRes, usersRes] = await Promise.all([
                fetch("/api/parcels"),
                fetch("/api/admin/users")
            ]);

            if (parcelsRes.ok) setParcels(await parcelsRes.json());
            if (usersRes.ok) setUsers(await usersRes.json());
        } catch (error) {
            console.error("Failed to fetch data", error);
        }
    };

    const fetchTask = async () => {
        try {
            const res = await fetch(`/api/tasks/${taskId}`);
            if (res.ok) {
                const task = await res.json();
                setFormData({
                    content: task.content,
                    parcelId: task.parcelId,
                    customerId: task.customerId || "",
                    assignedTo: task.assignedTo || "",
                    priority: task.priority || "MEDIUM",
                    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
                    tags: task.tags || ""
                });
            }
        } catch (error) {
            console.error("Failed to fetch task", error);
        }
    };

    const fetchCustomersForParcel = async (parcelId: number) => {
        try {
            const res = await fetch(`/api/crm/customers?parcelId=${parcelId}`);
            if (res.ok) {
                setCustomers(await res.json());
            }
        } catch (error) {
            console.error("Failed to fetch customers", error);
        }
    };

    const handleParcelChange = (parcelId: string) => {
        setFormData({ ...formData, parcelId, customerId: "" });
        if (parcelId) {
            fetchCustomersForParcel(parseInt(parcelId));
        } else {
            setCustomers([]);
        }
    };

    const validate = () => {
        const newErrors: any = {};

        if (!formData.content.trim()) {
            newErrors.content = "Görev başlığı gereklidir";
        }

        if (!formData.parcelId) {
            newErrors.parcelId = "Parsel seçimi gereklidir";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);
        try {
            const url = taskId ? `/api/tasks/${taskId}` : "/api/tasks";
            const method = taskId ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    parcelId: parseInt(formData.parcelId as string),
                    customerId: formData.customerId ? parseInt(formData.customerId as string) : null,
                    assignedTo: formData.assignedTo ? parseInt(formData.assignedTo as string) : null
                })
            });

            if (res.ok) {
                onSuccess();
                handleClose();
            } else {
                const error = await res.json();
                alert(error.error || "Görev kaydedilemedi");
            }
        } catch (error) {
            console.error("Failed to save task", error);
            alert("Bir hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            content: "",
            parcelId: defaultParcelId || "",
            customerId: "",
            assignedTo: "",
            priority: "MEDIUM",
            dueDate: "",
            tags: ""
        });
        setErrors({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">
                        {taskId ? "Görevi Düzenle" : "Yeni Görev Oluştur"}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Task Title */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Görev Başlığı *
                        </label>
                        <input
                            type="text"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500 ${errors.content ? "border-red-500" : "border-gray-300"
                                }`}
                            placeholder="Örn: Site ziyareti yap"
                        />
                        {errors.content && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {errors.content}
                            </p>
                        )}
                    </div>

                    {/* Parcel Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            İlgili Parsel *
                        </label>
                        <select
                            value={formData.parcelId}
                            onChange={(e) => handleParcelChange(e.target.value)}
                            className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500 bg-white ${errors.parcelId ? "border-red-500" : "border-gray-300"
                                }`}
                        >
                            <option value="">Parsel Seçiniz...</option>
                            {parcels.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.city} - {p.district} - Ada: {p.island}, Parsel: {p.parsel}
                                </option>
                            ))}
                        </select>
                        {errors.parcelId && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {errors.parcelId}
                            </p>
                        )}
                    </div>

                    {/* Customer Selection (optional) */}
                    {customers.length > 0 && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                İlgili Müşteri (Opsiyonel)
                            </label>
                            <select
                                value={formData.customerId}
                                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            >
                                <option value="">Müşteri Seçiniz...</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} ({c.role})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Assign To */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <User className="h-4 w-4 inline mr-1" />
                                Atanan Kişi
                            </label>
                            <select
                                value={formData.assignedTo}
                                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            >
                                <option value="">Kendime Ata</option>
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Öncelik
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            >
                                <option value="LOW">Düşük</option>
                                <option value="MEDIUM">Orta</option>
                                <option value="HIGH">Yüksek</option>
                                <option value="URGENT">Acil</option>
                            </select>
                        </div>
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <Calendar className="h-4 w-4 inline mr-1" />
                            Bitiş Tarihi
                        </label>
                        <input
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <Tag className="h-4 w-4 inline mr-1" />
                            Etiketler (Virgülle ayırın)
                        </label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Örn: Acil, Teklif, Site Ziyareti"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                            {taskId ? "Güncelle" : "Oluştur"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
