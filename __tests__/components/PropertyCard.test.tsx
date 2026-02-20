import { render, screen } from "@testing-library/react";
import PropertyCard from "@/components/PropertyCard";
import { describe, it, expect, vi } from "vitest";
import { Property, PropertyType, PropertyStatus, RoomType } from "@/types/property";

describe("PropertyCard", () => {
    const mockProperty: Property = {
        id: 1,
        title: "Test Property",
        type: "APARTMENT" as PropertyType,
        status: "AVAILABLE" as PropertyStatus,
        city: "Istanbul",
        district: "Kadikoy",
        neighborhood: "Moda",
        roomType: "THREE_PLUS_ONE" as RoomType,
        grossArea: 120,
        hasElevator: true,
        hasParking: true,
        currentValue: 1000000,
        monthlyRent: 5000,
        ownerId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        images: [],
        parcel: {
            id: 1,
            island: "101",
            parsel: "5",
            neighborhood: "Moda"
        }
    };

    it("has accessible action buttons", () => {
        render(
            <PropertyCard
                property={mockProperty}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        expect(screen.getByRole("link", { name: /detaylar/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /düzenle/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /sil/i })).toBeInTheDocument();
    });
});
