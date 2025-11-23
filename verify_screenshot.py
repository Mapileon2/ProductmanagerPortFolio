
import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        try:
            await page.goto("http://localhost:5173/")
            await page.click("text=Admin Panel")
            await page.wait_for_selector("text=Admin Dashboard", timeout=10000)
            await page.click("button:has-text('Publish Portfolio')")
            await page.wait_for_selector("h2:has-text('Portfolio Publisher')")

            # Wait for the specific warning element to ensure it's rendered
            await page.wait_for_selector("text=Username Required for Publishing")

            await page.screenshot(path="verification.png")
            print("Screenshot saved to verification.png")

        except Exception as e:
            print(f"Test failed: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
