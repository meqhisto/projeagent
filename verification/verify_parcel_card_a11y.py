import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to /test-ui...")
        try:
            page.goto("http://localhost:3000/test-ui", timeout=60000)
            # wait for at least one parcel card to appear
            page.wait_for_selector(".group.card", timeout=10000)
        except Exception as e:
            print(f"Failed to navigate: {e}")
            return

        print("Page loaded.")

        # Locate the first card
        card = page.locator(".group.card").first

        # Hover over the card to make buttons visible
        print("Hovering over the card...")
        card.hover()

        # Verify aria-labels and titles
        print("Verifying button attributes...")

        quick_view_btn = card.locator("button[aria-label='Parsel detaylarını görüntüle']")
        edit_btn = card.locator("button[aria-label='Parseli düzenle']")
        delete_btn = card.locator("button[aria-label='Parseli sil']")

        if quick_view_btn.count() > 0:
            print("SUCCESS: Quick View button found by aria-label.")
            title = quick_view_btn.get_attribute("title")
            if title == "Hızlı Bakış":
                print("SUCCESS: Quick View button has correct title.")
            else:
                print(f"FAILURE: Quick View button has wrong title: {title}")
        else:
            print("FAILURE: Quick View button NOT found by aria-label.")

        if edit_btn.count() > 0:
            print("SUCCESS: Edit button found by aria-label.")
            title = edit_btn.get_attribute("title")
            if title == "Düzenle":
                print("SUCCESS: Edit button has correct title.")
            else:
                print(f"FAILURE: Edit button has wrong title: {title}")
        else:
            print("FAILURE: Edit button NOT found by aria-label.")

        if delete_btn.count() > 0:
            print("SUCCESS: Delete button found by aria-label.")
            title = delete_btn.get_attribute("title")
            if title == "Sil":
                print("SUCCESS: Delete button has correct title.")
            else:
                print(f"FAILURE: Delete button has wrong title: {title}")
        else:
            print("FAILURE: Delete button NOT found by aria-label.")

        # Take screenshot
        output_path = "/home/jules/verification/verification.png"
        page.screenshot(path=output_path)
        print(f"Screenshot saved to {output_path}")

        browser.close()

if __name__ == "__main__":
    run()
