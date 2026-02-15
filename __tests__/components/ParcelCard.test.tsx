import { render, screen } from "@testing-library/react";
import ParcelCard from "@/components/ParcelCard";
import { describe, it, expect, vi } from "vitest";

// Mock useRouter
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

describe("ParcelCard", () => {
  const mockProps = {
    id: 1,
    city: "Istanbul",
    district: "Kadikoy",
    island: 101,
    parcel: 5,
    status: "PENDING" as const,
    category: "RESIDENTIAL",
    zoning: { ks: 1.5, taks: 0.5 },
  };

  it("renders with correct accessibility attributes for actions", () => {
    render(<ParcelCard {...mockProps} />);

    // Check for "Hızlı Önizleme" button
    const quickViewBtn = screen.getByRole("button", { name: /Hızlı Önizleme/i });
    expect(quickViewBtn).toBeInTheDocument();
    expect(quickViewBtn).toHaveAttribute("title", "Hızlı Önizleme");
    expect(quickViewBtn).toHaveAttribute("type", "button");

    // Check for "Düzenle" button
    const editBtn = screen.getByRole("button", { name: /Düzenle/i });
    expect(editBtn).toBeInTheDocument();
    expect(editBtn).toHaveAttribute("title", "Düzenle");
    expect(editBtn).toHaveAttribute("type", "button");

    // Check for "Sil" button
    const deleteBtn = screen.getByRole("button", { name: /Sil/i });
    expect(deleteBtn).toBeInTheDocument();
    expect(deleteBtn).toHaveAttribute("title", "Sil");
    expect(deleteBtn).toHaveAttribute("type", "button");
  });
});
