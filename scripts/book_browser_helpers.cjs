/* Open the retractable paper tabs through the same edge target as a reader. */
async function revealBookControls(page) {
  if (await page.locator('html.immersive-reading #stage.is-reading-quiet').count()) {
    await page.locator('.reader-edge--right').click();
  }
}
module.exports = { revealBookControls };
