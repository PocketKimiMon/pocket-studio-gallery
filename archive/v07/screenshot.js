const { chromium } = require('playwright');

const VIEWPORTS = [
  { name: 'desktop',      width: 1280, height: 900,  full: true  },
  { name: 'tablet',       width: 820,  height: 1180, full: true  },
  { name: 'mobile',       width: 390,  height: 844,  full: true  },
  { name: 'mobile-small', width: 360,  height: 800,  full: true  },
  { name: 'mobile-tiny',  width: 320,  height: 700,  full: true  },
];

(async () => {
  const url = process.argv[2] || 'http://localhost:8000';
  const browser = await chromium.launch();

  for (const v of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: v.width, height: v.height } });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    const data = await page.evaluate(() => {
      const vw = window.innerWidth;
      const docW = document.documentElement.scrollWidth;
      return {
        vw, docW,
        hasOverflow: docW > vw + 1,
        wordmarkSpans: Array.from(document.querySelectorAll('.wordmark span'))
          .map(el => {
            const r = el.getBoundingClientRect();
            return { x: Math.round(r.x), w: Math.round(r.width), right: Math.round(r.x + r.width) };
          }),
        fab: (() => {
          const f = document.querySelector('#bp-fab');
          if (!f) return null;
          const r = f.getBoundingClientRect();
          return { x: Math.round(r.x), w: Math.round(r.width), right: Math.round(r.x + r.width) };
        })(),
        ctaBtn: (() => {
          const b = document.querySelector('.book-cta-btn');
          if (!b) return null;
          const r = b.getBoundingClientRect();
          return { x: Math.round(r.x), w: Math.round(r.width), right: Math.round(r.x + r.width) };
        })(),
        services: Array.from(document.querySelectorAll('.service'))
          .map(el => Math.round(el.getBoundingClientRect().width)),
        policies: Array.from(document.querySelectorAll('.policy'))
          .map(el => Math.round(el.getBoundingClientRect().width)),
        secNotes: Array.from(document.querySelectorAll('.sec-note'))
          .map(el => {
            const r = el.getBoundingClientRect();
            return { x: Math.round(r.x), w: Math.round(r.width), right: Math.round(r.x + r.width) };
          }),
      };
    });

    const issues = [];
    if (data.hasOverflow) issues.push(`OVERFLOW: docW=${data.docW} > vw=${data.vw}`);
    if (data.fab && data.fab.right > data.vw + 1) issues.push(`FAB overflows right by ${data.fab.right - data.vw}px`);
    if (data.ctaBtn && data.ctaBtn.right > data.vw + 1) issues.push(`CTA button overflows right by ${data.ctaBtn.right - data.vw}px`);
    data.secNotes.forEach((n, i) => {
      if (n.right > data.vw + 1) issues.push(`sec-note[${i}] overflows right by ${n.right - data.vw}px`);
    });
    data.wordmarkSpans.forEach((s, i) => {
      if (s.right > data.vw + 1) issues.push(`wordmark span[${i}] overflows right by ${s.right - data.vw}px`);
    });

    console.log(`\n=== ${v.name} (${v.width}x${v.height}) ===`);
    console.log(`  vw=${data.vw} docW=${data.docW} hasOverflow=${data.hasOverflow}`);
    console.log(`  wordmark spans: ${data.wordmarkSpans.map(s => `[${s.x}, ${s.right}]`).join(' ')}`);
    console.log(`  service widths: [${data.services.join(', ')}]  policy widths: [${data.policies.join(', ')}]`);
    console.log(`  fab: x=${data.fab?.x} right=${data.fab?.right}  ctaBtn: x=${data.ctaBtn?.x} right=${data.ctaBtn?.right}`);
    console.log(`  sec-note rights: [${data.secNotes.map(n => n.right).join(', ')}]`);
    if (issues.length === 0) {
      console.log(`  ✓ PASS`);
    } else {
      console.log(`  ✗ FAIL`);
      issues.forEach(i => console.log(`     - ${i}`));
    }

    await page.screenshot({ path: `screenshot-${v.name}.png`, fullPage: v.full });
    await page.close();
  }

  await browser.close();
  console.log('\nAll screenshots saved.');
})();
