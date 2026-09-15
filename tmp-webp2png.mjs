// Временный скрипт: webp -> png/jpg через Playwright (Figma не принимает webp).
// Удалить после использования.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const SRC = "C:/Project/siteportfolio/dist/assets/optimized";
const OUT = process.argv[2];
const items = JSON.parse(process.argv[3]); // [{file, out, width?, quality?}]

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();

for (const item of items) {
  const buf = fs.readFileSync(path.join(SRC, item.file));
  const b64 = buf.toString("base64");
  await page.setContent(
    `<body style="margin:0"><img id="i" src="data:image/webp;base64,${b64}"></body>`
  );
  await page.waitForFunction(() => {
    const i = document.getElementById("i");
    return i && i.complete && i.naturalWidth > 0;
  }, null, { timeout: 30000 });

  const nat = await page.evaluate(() => {
    const i = document.getElementById("i");
    return { w: i.naturalWidth, h: i.naturalHeight };
  });

  if (item.width) {
    await page.evaluate((w) => {
      const i = document.getElementById("i");
      i.style.width = w + "px";
      i.style.height = "auto";
      i.style.display = "block";
    }, item.width);
  } else {
    await page.evaluate(() => {
      document.getElementById("i").style.display = "block";
    });
  }

  const el = await page.$("#i");
  const type = item.out.endsWith(".jpg") ? "jpeg" : "png";
  const opts = { path: path.join(OUT, item.out), type };
  if (type === "jpeg") opts.quality = item.quality ?? 70;
  await el.screenshot(opts);
  const st = fs.statSync(path.join(OUT, item.out));
  console.log(`${item.file} natural=${nat.w}x${nat.h} -> ${item.out} ${Math.round(st.size / 1024)}KB`);
}

await browser.close();
