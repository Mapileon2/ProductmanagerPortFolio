
import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        try:
            # 1. Verify Landing Page (Root URL)
            print("Navigating to home (Root URL)...")
            await page.goto("http://localhost:5173/")

            # Wait for content to load
            await page.wait_for_timeout(2000)

            content = await page.content()

            # Check for Landing Page specific text
            if "Showcase Your Work" in content and "Magically" in content:
                print("✅ PASSED: Landing Page is active on Root URL.")
            else:
                print("❌ FAILED: Landing Page text not found.")
                print(f"Found content snippet: {content[:200]}")

            # Check for Stats
            if "124+" in content:
                print("✅ PASSED: System Stats displayed (Mock Data verified).")
            else:
                print("❌ FAILED: System Stats not found.")

            # Check for CTA
            cta_btn = await page.query_selector("button:has-text('Create Your Portfolio')")
            if cta_btn:
                print("✅ PASSED: 'Create Your Portfolio' CTA found.")
            else:
                print("❌ FAILED: CTA button not found.")

            await page.screenshot(path="verification_landing.png")
            print("Screenshot saved to verification_landing.png")

        except Exception as e:
            print(f"Test failed with error: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
