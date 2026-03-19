const { chromium } = require('playwright');

(async () => {
  console.log("Launching browser to add HQ...");
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to Risk Zones
    await page.goto('http://localhost:5173/#/risk-zones');
    await page.waitForTimeout(2000);
    
    console.log("Clicking 'Add HQ' button...");
    await page.locator('button:has-text("Add HQ")').click();
    await page.waitForTimeout(1000);
    
    console.log("Entering HQ Name...");
    await page.locator('input[placeholder="HQ name…"]').fill('New Central Command');
    await page.waitForTimeout(1000);
    
    console.log("Clicking 'Next ->'...");
    await page.locator('button:has-text("Next →")').click();
    await page.waitForTimeout(1000);
    
    console.log("Clicking on the map to place HQ...");
    // Click roughly in the center of the map
    const mapBounds = await page.locator('.leaflet-container').boundingBox();
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + mapBounds.width / 2, mapBounds.y + mapBounds.height / 2);
      console.log("HQ added successfully via UI interaction!");
    } else {
      console.log("Could not find map container to click.");
    }
    
    await page.waitForTimeout(2000); // Wait to see the result
  } catch (error) {
    console.error("Error adding HQ:", error);
  } finally {
    await browser.close();
  }
})();
