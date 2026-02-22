import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import NotificationBell from "../components/NotificationBell";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("NotificationBell", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock response: 0 unread
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ notifications: [], unreadCount: 0 }),
        });
    });

    it("renders the bell button", async () => {
        render(<NotificationBell />);
        // Currently it might not have a name, so we just get by role
        const button = screen.getByRole("button");
        expect(button).toBeInTheDocument();
    });

    it("shows unread count badge", async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                notifications: [
                    { id: 1, title: "Test", message: "Msg", isRead: false, createdAt: new Date().toISOString(), type: "TASK_DUE" }
                ],
                unreadCount: 1
            }),
        });

        render(<NotificationBell />);

        await waitFor(() => {
            expect(screen.getByText("1")).toBeInTheDocument();
        });
    });

    it("opens dropdown on click", async () => {
        render(<NotificationBell />);
        const button = screen.getByRole("button");
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText("Bildirimler")).toBeInTheDocument();
        });
    });
});
