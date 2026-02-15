import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Sidebar from "@/components/Sidebar";

// Base mock setup
const mockUseSession = vi.fn();
const mockSignOut = vi.fn();

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
    useSession: () => mockUseSession(),
    signOut: () => mockSignOut(),
}));

// Mock usePathname
vi.mock("next/navigation", () => ({
    usePathname: () => "/",
}));

describe("Sidebar", () => {
    beforeEach(() => {
        // Default mock for USER role
        mockUseSession.mockReturnValue({
            data: {
                user: {
                    id: "1",
                    name: "Test User",
                    email: "test@example.com",
                    role: "USER",
                },
            },
            status: "authenticated",
        });
    });

    it("renders the logo and title", () => {
        render(<Sidebar />);
        expect(screen.getByText("PM")).toBeInTheDocument();
        expect(screen.getByText("ParselMonitor")).toBeInTheDocument();
    });

    it("renders navigation items for USER role", () => {
        render(<Sidebar />);
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        expect(screen.getByText("Arsalar")).toBeInTheDocument();
        expect(screen.getByText("Harita")).toBeInTheDocument();
        // Should not see Admin only items
        expect(screen.queryByText("Kullanıcı Yönetimi")).not.toBeInTheDocument();
    });

    it("shows user profile section with user name and role", () => {
        render(<Sidebar />);
        expect(screen.getByText("Test User")).toBeInTheDocument();
        expect(screen.getByText("Kullanıcı")).toBeInTheDocument(); // Role label for USER
    });

    it("shows user initials", () => {
        render(<Sidebar />);
        // Initials logic: T (from Test User)
        expect(screen.getByText("T")).toBeInTheDocument();
    });
});

describe("Sidebar with Admin role", () => {
    beforeEach(() => {
        mockUseSession.mockReturnValue({
            data: {
                user: {
                    id: "1",
                    name: "Admin User",
                    email: "admin@example.com",
                    role: "ADMIN",
                },
            },
            status: "authenticated",
        });
    });

    it("shows Admin Panel items for ADMIN role", () => {
        render(<Sidebar />);
        expect(screen.getByText("Kullanıcı Yönetimi")).toBeInTheDocument();
    });

    it("shows user profile as Manager", () => {
        render(<Sidebar />);
        expect(screen.getByText("Yönetici")).toBeInTheDocument(); // Role label for ADMIN
    });
});

describe("Sidebar without session", () => {
    beforeEach(() => {
        mockUseSession.mockReturnValue({
            data: null,
            status: "unauthenticated",
        });
    });

    it("does not show user profile when not authenticated", () => {
        render(<Sidebar />);
        expect(screen.queryByText("Test User")).not.toBeInTheDocument();
    });
});
