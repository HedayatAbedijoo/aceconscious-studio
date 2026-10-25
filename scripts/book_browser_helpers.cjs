/* Open the retractable paper tabs through the reader's menu button. */
async function revealBookControls(page) {
  if (await page.locator('#stage.is-reading-quiet').count()) {
    await page.locator('#book-menu-toggle').click();
  }
}
module.exports = { revealBookControls };
