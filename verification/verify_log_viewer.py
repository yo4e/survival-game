from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Go to the game
    print("Navigating to game...")
    page.goto("http://localhost:5173/")

    # Wait for the game to load (look for stage name)
    print("Waiting for game to load...")
    page.wait_for_selector("text=極寒の雪山")

    # Click '焚き火' a few times to generate logs
    print("Clicking '焚き火'...")
    fire_button = page.get_by_text("焚き火")
    for _ in range(3):
        fire_button.click()
        page.wait_for_timeout(500) # Wait a bit for log animation/update

    # Take a screenshot
    print("Taking screenshot...")
    page.screenshot(path="verification/log_viewer_test.png", full_page=True)

    browser.close()
    print("Done!")

with sync_playwright() as playwright:
    run(playwright)
