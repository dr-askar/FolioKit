/** Inspect real PDF pages without changing selection; run against an Android export. */
const { chromium } = require('playwright');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
(async () => {
  const root = path.resolve(process.env.FOLIOKIT_STATIC_DIR || 'out');
  const output = path.resolve(process.env.FOLIOKIT_UI_OUTPUT || '/tmp/foliokit-pages-proof');
  fs.mkdirSync(output, { recursive: true });
  let server;
  let base = process.env.FOLIOKIT_TEST_BASE;
  if (!base) {
    assert(fs.existsSync(path.join(root, 'en/tools/delete-pages/index.html')), 'Run npm run android:sync first.');
    const mime = { '.js':'application/javascript','.css':'text/css','.json':'application/json','.html':'text/html','.svg':'image/svg+xml','.wasm':'application/wasm' };
    server = http.createServer((req, res) => {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      let file = path.resolve(root, '.' + pathname);
      if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
      res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); fs.createReadStream(file).pipe(res);
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  }
  async function fixture(count) {
    const pdf = await PDFDocument.create(); const font = await pdf.embedFont(StandardFonts.Helvetica);
    for(let n=1;n<=count;n++) { const p=pdf.addPage([400+n*10,600]); p.drawText(`Page ${n} - confirm before selecting`,{x:24,y:500,size:16,font}); p.drawRectangle({x:24,y:180,width:250,height:240,color:rgb(.1,.3,.7)}); }
    return Buffer.from(await pdf.save());
  }
  const four = await fixture(4);
  const browser = await chromium.launch({ executablePath:process.env.BROWSER_EXECUTABLE || '/usr/bin/chromium',args:['--no-sandbox'] });
  try {
    for (const [locale,width,height] of [['en',320,640],['ar',393,852],['de',360,800],['en',844,390]]) {
      const context = await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true,acceptDownloads:true}); const page=await context.newPage();
      const errors=[]; page.on('pageerror',e=>errors.push(e.message));
      await page.goto(`${base}/${locale}/tools/delete-pages/`,{waitUntil:'domcontentloaded',timeout:120000});
      await page.locator('input[type=file]').first().setInputFiles({name:'Confirm the correct pages before deleting.pdf',mimeType:'application/pdf',buffer:four});
      const grid=page.locator('.foliokit-page-grid'); await grid.waitFor();
      await page.waitForFunction(()=>document.querySelector('.foliokit-page-grid img')?.naturalWidth>=300);
      const selection=grid.locator('.foliokit-page-tile > button[aria-pressed]');
      await selection.nth(1).tap(); assert.equal(await selection.nth(1).getAttribute('aria-pressed'),'true');
      const before=(await selection.first().boundingBox()).width;
      const enlarge=page.locator('.foliokit-page-controls button').last(); await enlarge.tap();
      assert((await selection.first().boundingBox()).width>before*1.5,'Larger previews did not enlarge the cards');
      await grid.locator('.foliokit-page-zoom').nth(1).tap();
      const dialog=page.locator('dialog.foliokit-page-dialog'); await dialog.waitFor();
      await page.waitForFunction(()=>{const c=document.querySelector('.foliokit-page-dialog canvas');return c?.width>200&&!document.querySelector('.foliokit-page-dialog [role=status]')});
      const initial=await dialog.locator('canvas').evaluate(c=>c.getBoundingClientRect().width);
      await dialog.locator('.foliokit-inspection-controls button').last().tap();
      await page.waitForFunction(w=>document.querySelector('.foliokit-page-dialog canvas').getBoundingClientRect().width>w,initial);
      await page.screenshot({path:path.join(output,`${locale}-${width}-inspect.png`)});
      await dialog.locator('header button').tap();
      assert.equal(await selection.nth(1).getAttribute('aria-pressed'),'true','Inspecting changed selected page');
      assert.equal(await selection.nth(0).getAttribute('aria-pressed'),'false','Inspecting selected another page');
      await page.screenshot({path:path.join(output,`${locale}-${width}-grid.png`)});
      const deleteButton=page.locator('button.bg-red-600'); await deleteButton.tap();
      const downloadButton=deleteButton.locator('..').locator('button').nth(1); await downloadButton.waitFor();
      const downloaded=page.waitForEvent('download'); await downloadButton.tap();
      const result=await PDFDocument.load(fs.readFileSync(await(await downloaded).path()));
      assert.deepEqual(result.getPages().map(p=>Math.round(p.getWidth())),[410,430,440],'Export removed the wrong page');
      assert.deepEqual(errors,[]);
      console.log(`${locale} ${width}x${height}: larger sharp previews, independent inspection/zoom, preserved selection and correct deletion/export passed.`);
      await context.close();
    }
    const context=await browser.newContext({viewport:{width:360,height:800},hasTouch:true,isMobile:true}); const page=await context.newPage();
    await page.goto(`${base}/en/tools/delete-pages/`,{waitUntil:'domcontentloaded'});
    await page.locator('input[type=file]').first().setInputFiles({name:'52 synthetic pages.pdf',mimeType:'application/pdf',buffer:await fixture(52)});
    await page.locator('.foliokit-page-grid').waitFor();
    await page.locator('.foliokit-page-zoom').nth(50).tap();
    await page.waitForFunction(()=>document.querySelector('.foliokit-page-dialog canvas')?.width>200&&!document.querySelector('.foliokit-page-dialog [role=status]'));
    assert.equal(await page.locator('.foliokit-page-dialog [role=alert]').count(),0,'Cannot inspect a page beyond thumbnail limit');
    await page.keyboard.press('Escape'); assert.equal(await page.locator('dialog').count(),0);
    assert.equal(await page.locator('.foliokit-page-grid button[aria-pressed=true]').count(),0);
    console.log('Page 51: actual PDF rendering beyond thumbnail limit and Escape without selection changes passed.');
    for (const slug of ['extract-pages','split-pdf','organize-pdf','rotate-pdf','rotate-custom','pdf-multi-tool']) {
      await page.goto(`${base}/en/tools/${slug}/`,{waitUntil:'domcontentloaded'});
      await page.locator('input[type=file]').first().setInputFiles({name:'four pages.pdf',mimeType:'application/pdf',buffer:four});
      await page.locator('.foliokit-page-grid').waitFor();
      assert.equal(await page.locator('.foliokit-page-zoom').count(),4,slug);
      console.log(`${slug}: shared sizing and per-page inspection available.`);
    }
    await context.close();
  } finally { await browser.close(); server?.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
