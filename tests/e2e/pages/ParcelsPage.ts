import { Page, Locator, expect } from "@playwright/test";

export class ParcelsPage {
    readonly page: Page;
    readonly addParcelButton: Locator;

    // Add Parcel Form Elements
    readonly citySelect: Locator;
    readonly districtInput: Locator;
    readonly neighborhoodInput: Locator;
    readonly islandInput: Locator;
    readonly parcelInput: Locator;
    readonly saveButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.addParcelButton = page.getByRole("link", { name: "Yeni Parsel Ekle" });

        // Form selectors (adjust based on actual inputs in AddParcelDrawer)
        this.citySelect = page.locator('select[name="city"]');
        this.districtInput = page.locator('input[name="district"]');
        this.neighborhoodInput = page.locator('input[name="neighborhood"]');
        this.islandInput = page.locator('input[name="island"]');
        this.parcelInput = page.locator('input[name="parsel"]');
        this.saveButton = page.getByRole("button", { name: "Kaydet" });
    }

    async goto() {
        await this.page.goto("/parcels");
    }

    async openAddParcelModal() {
        await this.addParcelButton.click();
        await expect(this.page).toHaveURL(/\/parcels\/add/);
    }

    async fillParcelForm(data: { city: string; district: string; island: string; parcel: string }) {
        // Simplified for example
        await this.districtInput.fill(data.district);
        await this.islandInput.fill(data.island);
        await this.parcelInput.fill(data.parcel);
    }
}
