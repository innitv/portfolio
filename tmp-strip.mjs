// Временный скрипт: склейка трёх кадров в одну полосу для ленты 390. Удалить после.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const SRC = "C:/Project/siteportfolio/dist/assets/optimized";
const OUT = process.argv[2];
const files = [
  "a3-dashboard-redesign-figma-main-card-CSycQJK_-717.webp",
  "rtk-subscriptions-hero-BkvQSUev-1434.webp",
  "35KZ4z8mfO8o60nT7OmQ5Pdu8o-2880.webp",
];
const CELL_W = 350, CELL_H = 180, GAP = 12;

const b64 = files.map((f) => fs.readFileSync(path.join(SRC, f)).toString("base64"));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 400 } });

const cells = b64
  .map(
    (b) =>
      `<div style="width:${CELL_W}px;height:${CELL_H}px;overflow:hidden;background:#F2EFE9">
         <img src="data:image/webp;base64,${b}" style="width:${CELL_W}px;display:block">
       </div>`
  )
  .join("");

await page.setContent(
  `<body style="margin:0;background:#F2EFE9">
     <div id="strip" style="display:flex;gap:${GAP}px;background:#F2EFE9;width:${
    CELL_W * 3 + GAP * 2
  }px;height:${CELL_H}px">${cells}</div>
   </body>`
);
await page.waitForFunction(
  () => [...document.images].every((i) => i.complete && i.naturalWidth > 0),
  null,
  { timeout: 30000 }
);
const el = await page.$("#strip");
const out = path.join(OUT, "strip3.jpg");
await el.screenshot({ path: out, type: "jpeg", quality: 52 });
console.log("strip3.jpg", Math.round(fs.statSync(out).size / 1024) + "KB");
await browser.close();
