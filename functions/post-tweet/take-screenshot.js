const puppeteer = require("puppeteer");

// const urlToOpen = "https://tree.ollieq.co.uk"; // Replace with the URL you want to open
const urlToOpen = "http://localhost:3000"; // Replace with the URL you want to open

const takeScreenshot = async () => {
  console.log("launch puppeteer");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.setViewport({ width: 1200, height: 2000 });
  await page.goto(urlToOpen);
  console.log("load page");

  // Wait for the video element to be present
  await page.waitForSelector("video");

  // Wait for 10 seconds (adjust as needed)
  console.log("waiting for video");
  await page.waitForTimeout(10000);

  // Click the button with the id "hide-overlay-button"
  await page.click("#hide-overlay-button");

  // Wait for the overlay to hide (assuming it triggers some asynchronous action)
  // You might need to adjust this waiting logic based on your specific scenario
  await page.waitForTimeout(100); // Adjust the time as needed

  // Capture a screenshot of the video element
  const videoElement = await page.$("video");
  if (videoElement) {
    console.log("take screenshot");
    const screenshotBuffer = await videoElement.screenshot();
    await browser.close();
    console.log("returning buffer");
    return screenshotBuffer;
  } else {
    console.error("Video element not found");
  }
  await browser.close();
};

module.exports = takeScreenshot;
