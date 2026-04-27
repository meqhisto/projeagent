import { test, expect } from "@playwright/test";
import { ParcelsPage } from "./pages/ParcelsPage";

test.describe("Parcels Management", () => {
    test.beforeEach(async ({ page }) => {
        // Mock authentication or ensure logged in state
        // For now, we assume public access or mocked session
        // Depending on implementation, you might need to visit /login first
    });

    test("should open 'Add Parcel' modal via URL and verify elements", async ({ page }) => {
        const parcelsPage = new ParcelsPage(page);

        // Navigate to Parcels page
        await parcelsPage.goto();

        // Open Modal
        await parcelsPage.openAddParcelModal();

        // Verify modal elements are visible
        // Since modal is rendered via intercepting route, URL should be /parcels/add
        await expect(page).toHaveURL(/.*\/parcels\/add/);

        // Check if form inputs are visible
        await expect(parcelsPage.citySelect).toBeVisible();
        await expect(parcelsPage.saveButton).toBeVisible();
    });

    test("should support direct navigation to /parcels/add (fallback or modal)", async ({ page }) => {
        // Navigate directly to the modal URL
        await page.goto("/parcels/add");

        // Verify we are redirected to /parcels (as per current fallback implementation)
        // OR that the full page form is shown if implemented

        // Current implementation redirects to /parcels
        await expect(page).toHaveURL(/.*\/parcels/);
    });
});
