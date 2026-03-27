import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Sidebar from "@/components/Sidebar";

// Base mock setup
const mockUseSession = vi.fn();
const mockSignOut = vi.fn();

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

    it("renders the logo", () => {
        render(<Sidebar />);
        expect(screen.getByText("PM")).toBeInTheDocument();
        expect(screen.getByText("ParselMonitor")).toBeInTheDocument();
    });

    it("renders navigation items for USER role", () => {
        render(<Sidebar />);
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        expect(screen.getByText("Arsalar")).toBeInTheDocument();
        expect(screen.getByText("Harita")).toBeInTheDocument();
    });

    it("shows user profile section with user name", () => {
        render(<Sidebar />);
        expect(screen.getByText("Test User")).toBeInTheDocument();
        // expect(screen.getByText("test@example.com")).toBeInTheDocument(); // Email is not rendered in the updated design
    });

    // "Online" status was removed in the redesign for a cleaner look
    // it("shows Online status in profile", () => { ... });

    it("does not show Kullanıcı Yönetimi for USER role", () => {
        render(<Sidebar />);
        expect(screen.queryByText("Kullanıcı Yönetimi")).not.toBeInTheDocument();
    });

    it("shows user initials", () => {
        render(<Sidebar />);
        expect(screen.getByText("T")).toBeInTheDocument(); // First initial
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

    it("shows Kullanıcı Yönetimi for ADMIN role", () => {
        render(<Sidebar />);
        expect(screen.getByText("Kullanıcı Yönetimi")).toBeInTheDocument();
    });

    it("shows all navigation items for admin", () => {
        render(<Sidebar />);
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        expect(screen.getByText("Kullanıcı Yönetimi")).toBeInTheDocument();
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
