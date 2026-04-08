from playwright.sync_api import sync_playwright
import time

def take_screenshot():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        # Navigate to the locally running app
        page.goto("http://localhost:5173")
        # Wait a few seconds for the WebGL Globe to load and the websocket attacks to start rendering
        time.sleep(5)
        # Check if dashboard overlay exists and ensure it is visible by clicking the toggle button if needed
        # We can just wait for realistic render
        page.screenshot(path="frontend/src/assets/project_preview.png")
        browser.close()

if __name__ == "__main__":
    take_screenshot()
