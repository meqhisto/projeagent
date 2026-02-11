from playwright.sync_api import sync_playwright, expect

def test_accessibility(page):
    # Navigate to the test UI page
    page.goto("http://localhost:3000/test-ui")

    # Verify ParcelCard accessibility
    print("Verifying ParcelCard accessibility...")
    parcel_card_actions = page.locator(".group.card .absolute.top-3.right-3")

    # Check if buttons have aria-labels
    eye_btn = parcel_card_actions.locator("button[aria-label='Hızlı Önizleme']")
    expect(eye_btn).to_be_attached()
    expect(eye_btn).to_have_attribute("title", "Hızlı Önizleme")

    edit_btn = parcel_card_actions.locator("button[aria-label='Düzenle']")
    expect(edit_btn).to_be_attached()
    expect(edit_btn).to_have_attribute("title", "Düzenle")

    trash_btn = parcel_card_actions.locator("button[aria-label='Sil']")
    expect(trash_btn).to_be_attached()
    expect(trash_btn).to_have_attribute("title", "Sil")

    # Verify PropertyCard accessibility
    print("Verifying PropertyCard accessibility...")
    # PropertyCard has buttons in .absolute.bottom-3.right-3
    property_card_actions = page.locator(".group.relative .absolute.bottom-3.right-3")

    prop_eye_btn = property_card_actions.locator("a[aria-label='Görüntüle']")
    expect(prop_eye_btn).to_be_attached()
    expect(prop_eye_btn).to_have_attribute("title", "Görüntüle")

    prop_edit_btn = property_card_actions.locator("button[aria-label='Düzenle']")
    expect(prop_edit_btn).to_be_attached()

    prop_trash_btn = property_card_actions.locator("button[aria-label='Sil']")
    expect(prop_trash_btn).to_be_attached()

    # Verify DocumentUploadSection accessibility
    print("Verifying DocumentUploadSection accessibility...")
    # Find the section with "Belgeler"
    docs_section = page.locator("h3:has-text('Belgeler')").locator("..").locator("..")

    doc_download_btn = docs_section.locator("a[aria-label='İndir']")
    expect(doc_download_btn).to_be_attached()

    doc_delete_btn = docs_section.locator("button[aria-label='Sil']")
    expect(doc_delete_btn).to_be_attached()

    # Verify ImageUploadSection accessibility
    print("Verifying ImageUploadSection accessibility...")
    images_section = page.locator("h3:has-text('Görseller')").locator("..").locator("..")

    img_delete_btn = images_section.locator("button[aria-label='Sil']")
    expect(img_delete_btn).to_be_attached()

    # Screenshot
    print("Taking screenshot...")
    page.screenshot(path="verification/accessibility_check.png", full_page=True)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_accessibility(page)
            print("Accessibility verification passed!")
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/failure.png")
        finally:
            browser.close()
