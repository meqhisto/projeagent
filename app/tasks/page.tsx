"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Filter, CheckCircle2, Circle, AlertTriangle, Calendar, Edit2, Trash2 } from "lucide-react";
import TaskModal from "@/components/TaskModal";

interface Task {
    id: number;
    content: string;
    dueDate: string | null;
    priority: string;
    isCompleted: boolean;
    parcel: {
        city: string;
        district: string;
        island: string;
        parsel: string;
    };
    customer?: {
        name: string;
    };
    assignee?: {
        name: string;
    };
    creator?: {
        name: string;
    };
}

export default function TasksPage() {
    const { data: session } = useSession();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<number | undefined>();

    // Filters
    const [filter, setFilter] = useState<"all" | "assigned" | "created">("all");
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("pending");
    const [priorityFilter, setPriorityFilter] = useState<string>("all");

    useEffect(() => {
        fetchTasks();
    }, [filter, statusFilter, priorityFilter]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            let url = "/api/tasks?";

            if (filter === "assigned" && session?.user?.id) {
                url += `assignedTo=${session.user.id}&`;
            }

            if (statusFilter !== "all") {
                url += `status=${statusFilter}&`;
            }

            if (priorityFilter !== "all") {
                url += `priority=${priorityFilter}&`;
            }

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setTasks(data);
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

    const handleEdit = (taskId: number) => {
        setEditingTaskId(taskId);
        setIsModalOpen(true);
    };

    const getPriorityBadge = (priority: string) => {
        const colors = {
            URGENT: "bg-red-100 text-red-700 border-red-200",
            HIGH: "bg-orange-100 text-orange-700 border-orange-200",
            MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-200",
            LOW: "bg-blue-100 text-blue-700 border-blue-200"
        };

        const labels = {
            URGENT: "Acil",
            HIGH: "Yüksek",
            MEDIUM: "Orta",
            LOW: "Düşük"
        };

        return (
            <span className={`text-xs px-2 py-1 rounded-full border font-medium ${colors[priority as keyof typeof colors] || colors.MEDIUM}`}>
                {labels[priority as keyof typeof labels] || "Orta"}
            </span>
        );
    };

    const formatDaysUntil = (dueDate: string | null) => {
        if (!dueDate) return null;

        const due = new Date(dueDate);
        const now = new Date();
        const diffTime = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return <span className="text-red-600 font-semibold flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Gecikmiş ({Math.abs(diffDays)} gün)</span>;
        if (diffDays === 0) return <span className="text-orange-600 font-semibold">Bugün</span>;
        if (diffDays === 1) return <span className="text-yellow-600">Yarın</span>;
        return <span className="text-gray-600">{diffDays} gün kaldı</span>;
    };

    // Group tasks by status
    const overdueTasks = tasks.filter(t => !t.isCompleted && t.dueDate && new Date(t.dueDate) < new Date());
    const dueTodayTasks = tasks.filter(t => {
        if (t.isCompleted || !t.dueDate) return false;
        const due = new Date(t.dueDate);
        const today = new Date();
        return due.toDateString() === today.toDateString();
    });
    const upcomingTasks = tasks.filter(t => {
        if (t.isCompleted || !t.dueDate) return false;
        const due = new Date(t.dueDate);
        const today = new Date();
        return due > today && due.toDateString() !== today.toDateString();
    });
    const completedTasks = tasks.filter(t => t.isCompleted);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Görevler</h1>
                    <p className="text-sm text-gray-500 mt-1">Tüm görevlerinizi buradan yönetin</p>
                </div>
                <button
                    onClick={() => {
                        setEditingTaskId(undefined);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold shadow-sm"
                >
                    <Plus className="h-5 w-5" />
                    Yeni Görev
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-700">Filtreler</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* View Filter */}
                    <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Görünüm</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilter("all")}
                                className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${filter === "all"
                                        ? "bg-purple-600 text-white border-purple-600"
                                        : "bg-white text-gray-700 border-gray-300 hover:border-purple-300"
                                    }`}
                            >
                                Tümü
                            </button>
                            <button
                                onClick={() => setFilter("assigned")}
                                className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${filter === "assigned"
                                        ? "bg-purple-600 text-white border-purple-600"
                                        : "bg-white text-gray-700 border-gray-300 hover:border-purple-300"
                                    }`}
                            >
                                Bana Atanan
                            </button>
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Durum</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                        >
                            <option value="all">Tümü</option>
                            <option value="pending">Bekleyen</option>
                            <option value="completed">Tamamlanan</option>
                        </select>
                    </div>

                    {/* Priority Filter */}
                    <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Öncelik</label>
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                        >
                            <option value="all">Tümü</option>
                            <option value="URGENT">Acil</option>
                            <option value="HIGH">Yüksek</option>
                            <option value="MEDIUM">Orta</option>
                            <option value="LOW">Düşük</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Overdue Tasks */}
                    {overdueTasks.length > 0 && (
                        <TaskSection
                            title="⚠️ Gecikmiş Görevler"
                            tasks={overdueTasks}
                            onToggleComplete={handleToggleComplete}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            getPriorityBadge={getPriorityBadge}
                            formatDaysUntil={formatDaysUntil}
                        />
                    )}

                    {/* Due Today */}
                    {dueTodayTasks.length > 0 && (
                        <TaskSection
                            title="📅 Bugün Bitenler"
                            tasks={dueTodayTasks}
                            onToggleComplete={handleToggleComplete}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            getPriorityBadge={getPriorityBadge}
                            formatDaysUntil={formatDaysUntil}
                        />
                    )}

                    {/* Upcoming */}
                    {upcomingTasks.length > 0 && (
                        <TaskSection
                            title="📌 Yaklaşan Görevler"
                            tasks={upcomingTasks}
                            onToggleComplete={handleToggleComplete}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            getPriorityBadge={getPriorityBadge}
                            formatDaysUntil={formatDaysUntil}
                        />
                    )}

                    {/* Completed */}
                    {completedTasks.length > 0 && statusFilter !== "pending" && (
                        <TaskSection
                            title="✅ Tamamlanan Görevler"
                            tasks={completedTasks}
                            onToggleComplete={handleToggleComplete}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            getPriorityBadge={getPriorityBadge}
                            formatDaysUntil={formatDaysUntil}
                        />
                    )}

                    {tasks.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                            <CheckCircle2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">Görev bulunamadı</h3>
                            <p className="text-sm text-gray-500 mt-1">Yeni bir görev oluşturarak başlayın</p>
                        </div>
                    )}
                </div>
            )}

            {/* Task Modal */}
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
            />
        </div>
    );
}

// Task Section Component
function TaskSection({ title, tasks, onToggleComplete, onEdit, onDelete, getPriorityBadge, formatDaysUntil }: any) {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">{title}</h3>
            <div className="space-y-3">
                {tasks.map((task: Task) => (
                    <div
                        key={task.id}
                        className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors group border border-gray-100"
                    >
                        <button
                            onClick={() => onToggleComplete(task.id, task.isCompleted)}
                            className="mt-0.5"
                        >
                            {task.isCompleted ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                                <Circle className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                            )}
                        </button>

                        <div className="flex-1 min-w-0">
                            <p className={`font-medium text-gray-900 mb-1 ${task.isCompleted ? 'line-through opacity-60' : ''}`}>
                                {task.content}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                                <span className="flex items-center gap-1">
                                    📍 {task.parcel.city} - Ada: {task.parcel.island}, Parsel: {task.parcel.parsel}
                                </span>
                                {task.assignee && <span>👤 {task.assignee.name}</span>}
                                {task.customer && <span>🤝 {task.customer.name}</span>}
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                                {getPriorityBadge(task.priority)}
                                {task.dueDate && (
                                    <div className="text-xs">
                                        {formatDaysUntil(task.dueDate)}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => onEdit(task.id)}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                    title="Düzenle"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => onDelete(task.id)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    title="Sil"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
