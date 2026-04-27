import { Page, Locator, expect } from "@playwright/test";

export class LoginPage {
    readonly page: Page;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.emailInput = page.getByPlaceholder("E-posta adresiniz");
        this.passwordInput = page.getByPlaceholder("Şifreniz");
        this.loginButton = page.getByRole("button", { name: "Giriş Yap" });
    }

    async goto() {
        await this.page.goto("/login");
    }

    async login(email: string, pass: string) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(pass);
        await this.loginButton.click();
    }
}
