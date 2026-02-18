"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, AlertTriangle, Calendar, ChevronRight, Plus } from "lucide-react";
import TaskModal from "./TaskModal";

interface Task {
    id: number;
    content: string;
    dueDate: string | null;
    priority: string;
    isCompleted: boolean;
    parcel?: {
        city: string;
        district: string;
    };
}

interface TaskStats {
    overdue: number;
    dueToday: number;
    dueThisWeek: number;
}

export default function TaskWidget() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [stats, setStats] = useState<TaskStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchTasksAndStats();
    }, []);

    const fetchTasksAndStats = async () => {
        try {
            const [tasksRes, statsRes] = await Promise.all([
                fetch("/api/tasks?status=pending&type=TASK"),
                fetch("/api/tasks/stats")
            ]);

            if (tasksRes.ok) {
                const data = await tasksRes.json();
                setTasks(data.slice(0, 5)); // Show max 5 tasks
            }

            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data);
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
                fetchTasksAndStats();
            }
        } catch (error) {
            console.error("Failed to update task", error);
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

        if (diffDays < 0) return <span className="text-red-600 font-semibold">Gecikmiş</span>;
        if (diffDays === 0) return <span className="text-orange-600 font-semibold">Bugün</span>;
        if (diffDays === 1) return <span className="text-yellow-600">Yarın</span>;
        return <span className="text-gray-600">{diffDays} gün</span>;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="animate-pulse space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <h3 className="font-bold text-gray-900">Yaklaşan Görevler</h3>
                </div>
                <Link
                    href="/tasks"
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                >
                    Tümü
                    <ChevronRight className="h-4 w-4" />
                </Link>
            </div>

            {/* Stats */}
            {stats && (stats.overdue > 0 || stats.dueToday > 0 || stats.dueThisWeek > 0) && (
                <div className="flex gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                    {stats.overdue > 0 && (
                        <div className="flex items-center gap-1 text-sm">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <span className="text-red-600 font-semibold">{stats.overdue}</span>
                            <span className="text-gray-600">Gecikmiş</span>
                        </div>
                    )}
                    {stats.dueToday > 0 && (
                        <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-4 w-4 text-orange-600" />
                            <span className="text-orange-600 font-semibold">{stats.dueToday}</span>
                            <span className="text-gray-600">Bugün</span>
                        </div>
                    )}
                    {stats.dueThisWeek > 0 && (
                        <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span className="text-blue-600 font-semibold">{stats.dueThisWeek}</span>
                            <span className="text-gray-600">Bu Hafta</span>
                        </div>
                    )}
                </div>
            )}

            {/* Task List */}
            <div className="space-y-2">
                {tasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Tüm görevler tamamlandı! 🎉</p>
                    </div>
                ) : (
                    tasks.map((task) => (
                        <div
                            key={task.id}
                            className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                        >
                            <button
                                onClick={() => handleToggleComplete(task.id, task.isCompleted)}
                                aria-label={`${task.content} görevini ${task.isCompleted ? 'tamamlanmadı olarak işaretle' : 'tamamla'}`}
                                className="mt-0.5 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0071e3]/30"
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
                        </div>
                    ))
                )}
            </div>

            {/* View All Link */}
            {tasks.length > 0 && (
                <Link
                    href="/tasks"
                    className="block w-full text-center mt-4 py-2 text-sm text-purple-600 hover:text-purple-700 font-medium border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                >
                    Tüm Görevleri Görüntüle
                </Link>
            )}

            {/* New Task Button */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="w-full mt-2 py-2 text-sm bg-[#0071e3] text-white rounded-lg font-semibold hover:bg-[#0077ed] transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0071e3]/30"
            >
                <Plus className="h-4 w-4" />
                Yeni Görev
            </button>

            {/* Task Modal */}
            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchTasksAndStats}
            />
        </div>
    );
}
