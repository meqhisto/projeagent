import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ParcelCard from "@/components/ParcelCard";

// Mock next/navigation
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        refresh: vi.fn(),
        push: vi.fn(),
    }),
}));

describe("ParcelCard Accessibility", () => {
    const defaultProps = {
        id: 1,
        city: "İstanbul",
        district: "Kadıköy",
        island: 101,
        parcel: 5,
        status: "PENDING" as const,
        imageUrl: "http://example.com/image.jpg",
        category: "RESIDENTIAL",
    };

    it("has accessible names for action buttons", () => {
        render(<ParcelCard {...defaultProps} />);

        expect(screen.getByLabelText("Parsel detaylarını görüntüle")).toBeInTheDocument();
        expect(screen.getByLabelText("Parseli düzenle")).toBeInTheDocument();
        expect(screen.getByLabelText("Parseli sil")).toBeInTheDocument();
    });

    it("has accessible name for the main card link", () => {
        render(<ParcelCard {...defaultProps} />);

        // Main link wrapping the image
        const mainLink = screen.getByRole("link", { name: /İstanbul, Kadıköy - Ada 101 \/ Parsel 5 detaylarına git/i });
        expect(mainLink).toBeInTheDocument();
    });

    it("has title attributes for tooltips on action buttons", () => {
        render(<ParcelCard {...defaultProps} />);

        expect(screen.getByTitle("Detaylar")).toBeInTheDocument();
        expect(screen.getByTitle("Düzenle")).toBeInTheDocument();
        expect(screen.getByTitle("Sil")).toBeInTheDocument();
    });
});
