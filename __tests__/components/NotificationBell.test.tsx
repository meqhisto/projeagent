import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NotificationBell from "@/components/NotificationBell";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe("NotificationBell", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ notifications: [], unreadCount: 0 }),
        });
    });

    it("renders with accessible button", async () => {
        render(<NotificationBell />);
        // Wait for fetch to complete to silence act warning
        await waitFor(() => expect(fetchMock).toHaveBeenCalled());

        const button = screen.getByRole("button", { name: "Bildirimler" });
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute("aria-haspopup", "true");
    });

    it("opens dropdown on click", async () => {
        render(<NotificationBell />);
        await waitFor(() => expect(fetchMock).toHaveBeenCalled());

        const button = screen.getByRole("button", { name: "Bildirimler" });
        fireEvent.click(button);

        // Wait for dropdown to appear
        await waitFor(() => {
            const heading = screen.getByRole("heading", { name: "Bildirimler" });
            expect(heading).toBeInTheDocument();
        });
    });
});
