import { render, screen } from "@testing-library/react";
import ParcelCard from "@/components/ParcelCard";
import { describe, it, expect } from "vitest";

describe("ParcelCard", () => {
    const defaultProps = {
        id: 1,
        city: "Istanbul",
        district: "Kadikoy",
        island: 101,
        parcel: 5,
        status: "PENDING" as const,
        imageUrl: "/test.jpg",
        zoning: { ks: 1.5, taks: 0.4 },
        category: "RESIDENTIAL",
    };

    it("renders with essential information", () => {
        render(<ParcelCard {...defaultProps} />);
        expect(screen.getByText(/Istanbul, Kadikoy/)).toBeInTheDocument();
        expect(screen.getByText(/Ada 101 \/ Parsel 5/)).toBeInTheDocument();
    });

    it("has accessible action buttons", () => {
        render(<ParcelCard {...defaultProps} />);

        // These should fail initially because the buttons don't have aria-labels yet
        expect(screen.getByRole("button", { name: /hızlı bakış/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /düzenle/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /sil/i })).toBeInTheDocument();
    });
});
