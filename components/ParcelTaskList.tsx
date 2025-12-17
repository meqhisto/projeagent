"use client";

import { useState, useEffect } from "react";
import { Plus, CheckCircle2, Circle, Calendar, Edit2, Trash2, AlertTriangle } from "lucide-react";
import TaskModal from "./TaskModal";

interface Task {
    id: number;
    content: string;
    dueDate: string | null;
    priority: string;
    isCompleted: boolean;
    assignee?: {
        name: string;
    };
}

interface ParcelTaskListProps {
    parcelId: number;
}

export default function ParcelTaskList({ parcelId }: ParcelTaskListProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<number | undefined>();

    useEffect(() => {
        fetchTasks();
    }, [parcelId]);

    const fetchTasks = async () => {
        try {
            const res = await fetch(`/api/tasks?parcelId=${parcelId}`);
            if (res.ok) {
                const data = await res.json();
                setTasks(data.filter((t: any) => t.parcelId === parcelId));
            }
        } catch (error) {
            console.error("Failed to fetch tasks", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleComplete = async (taskId: number, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isCompleted: !currentStatus })
            });

            if (res.ok) {
                fetchTasks();
            }
        } catch (error) {
            console.error("Failed to update task", error);
        }
    };

    const handleDelete = async (taskId: number) => {
        if (!confirm("Bu görevi silmek istediğinize emin misiniz?")) return;

        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                fetchTasks();
            }
        } catch (error) {
            console.error("Failed to delete task", error);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "URGENT": return "text-red-600";
            case "HIGH": return "text-orange-600";
            case "MEDIUM": return "text-yellow-600";
            case "LOW": return "text-blue-600";
            default: return "text-gray-600";
        }
    };

    const formatDaysUntil = (dueDate: string | null) => {
        if (!dueDate) return null;

        const due = new Date(dueDate);
        const now = new Date();
        const diffTime = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return <span className="text-red-600 font-semibold flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Gecikmiş</span>;
        if (diffDays === 0) return <span className="text-orange-600 font-semibold">Bugün</span>;
        if (diffDays === 1) return <span className="text-yellow-600">Yarın</span>;
        return <span className="text-gray-600">{diffDays} gün</span>;
    };

    if (loading) {
        return <div className="text-center py-8 text-gray-500">Yükleniyor...</div>;
    }

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mt-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                    Görevler
                </h3>
                <button
                    onClick={() => {
                        setEditingTaskId(undefined);
                        setIsModalOpen(true);
                    }}
                    className="text-sm bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-emerald-700 flex items-center gap-1"
                >
                    <Plus className="h-4 w-4" />
                    Yeni Görev
                </button>
            </div>

            {tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Bu parsel için henüz görev eklenmemiş.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group border border-gray-100"
                        >
                            <button
                                onClick={() => handleToggleComplete(task.id, task.isCompleted)}
                                className="mt-0.5"
                            >
                                {task.isCompleted ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                ) : (
                                    <Circle className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                                )}
                            </button>

                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium text-gray-900 ${task.isCompleted ? 'line-through opacity-60' : ''}`}>
                                    {task.content}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    {task.assignee && (
                                        <span className="text-xs text-gray-600">
                                            👤 {task.assignee.name}
                                        </span>
                                    )}
                                    {task.dueDate && (
                                        <span className="text-xs">
                                            {formatDaysUntil(task.dueDate)}
                                        </span>
                                    )}
                                    <span className={`text-xs ${getPriorityColor(task.priority)}`}>
                                        {task.priority === "URGENT" ? "Acil" :
                                            task.priority === "HIGH" ? "Yüksek" :
                                                task.priority === "MEDIUM" ? "Orta" : "Düşük"}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => {
                                        setEditingTaskId(task.id);
                                        setIsModalOpen(true);
                                    }}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                    title="Düzenle"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(task.id)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    title="Sil"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <TaskModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingTaskId(undefined);
                }}
                onSuccess={() => {
                    fetchTasks();
                    setEditingTaskId(undefined);
                }}
                taskId={editingTaskId}
                defaultParcelId={parcelId}
            />
        </div>
    );
}
