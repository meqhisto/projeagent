"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import clsx from "clsx";

interface TabsContextType {
    activeTab: string;
    setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
    defaultValue: string;
    children: ReactNode;
    className?: string;
}

export function Tabs({ defaultValue, children, className = "" }: TabsProps) {
    const [activeTab, setActiveTab] = useState(defaultValue);

    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
            <div className={className}>
                {children}
            </div>
        </TabsContext.Provider>
    );
}

interface TabsListProps {
    children: ReactNode;
    className?: string;
}

export function TabsList({ children, className = "" }: TabsListProps) {
    return (
        <div className={clsx(
            "flex gap-0.5 p-1 bg-[#f5f5f7] rounded-xl",
            className
        )}>
            {children}
        </div>
    );
}

interface TabsTriggerProps {
    value: string;
    children: ReactNode;
    className?: string;
    icon?: ReactNode;
}

export function TabsTrigger({ value, children, className = "", icon }: TabsTriggerProps) {
    const context = useContext(TabsContext);
    if (!context) throw new Error("TabsTrigger must be used within Tabs");

    const { activeTab, setActiveTab } = context;
    const isActive = activeTab === value;

    return (
        <button
            onClick={() => setActiveTab(value)}
            className={clsx(
                "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2",
                isActive
                    ? "bg-white text-[#1d1d1f] shadow-sm"
                    : "text-[#6e6e73] hover:text-[#1d1d1f]",
                className
            )}
        >
            {icon && (
                <span className={clsx(
                    "transition-colors",
                    isActive ? "text-[#0071e3]" : "text-[#86868b]"
                )}>
                    {icon}
                </span>
            )}
            {children}
        </button>
    );
}

interface TabsContentProps {
    value: string;
    children: ReactNode;
    className?: string;
}

export function TabsContent({ value, children, className = "" }: TabsContentProps) {
    const context = useContext(TabsContext);
    if (!context) throw new Error("TabsContent must be used within Tabs");

    const { activeTab } = context;

    if (activeTab !== value) return null;

    return (
        <div className={clsx("py-6 animate-fade-in", className)}>
            {children}
        </div>
    );
}
