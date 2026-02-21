import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ParcelCard from "@/components/ParcelCard";

// Mock useRouter
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        refresh: vi.fn(),
        push: vi.fn(),
    }),
}));

describe("ParcelCard Accessibility", () => {
    const defaultProps = {
        id: 1,
        city: "Istanbul",
        district: "Kadikoy",
        island: 123,
        parcel: 45,
        status: "PENDING" as const,
        category: "RESIDENTIAL",
    };

    it("renders action buttons with correct aria-labels", () => {
        render(<ParcelCard {...defaultProps} />);

        // Check for aria-labels
        expect(screen.getByLabelText("Hızlı Görünüm")).toBeInTheDocument();
        expect(screen.getByLabelText("Düzenle")).toBeInTheDocument();
        expect(screen.getByLabelText("Sil")).toBeInTheDocument();
    });

    it("renders action buttons with correct titles", () => {
        render(<ParcelCard {...defaultProps} />);

        // Check for titles
        expect(screen.getByTitle("Hızlı Görünüm")).toBeInTheDocument();
        expect(screen.getByTitle("Düzenle")).toBeInTheDocument();
        expect(screen.getByTitle("Sil")).toBeInTheDocument();
    });
});
