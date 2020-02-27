const fs = require('fs')
const rimraf = require('rimraf')
const merge = require('easy-pdf-merge')
const puppeteer = require('puppeteer')

;(async () => {
  const pageMargin = 1
  const bookDir = './book'
  const finalOutputFilename = 'JavaScript-Book.pdf'
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto('https://javascript.info', { waitUntil: 'networkidle0' })
  const pages = await page.$$eval('.list-sub__link', (pageLinks, bookDir) => pageLinks.map(({ innerText, href }, index) => {
    const normalizedFileName = `${index + 1}-${innerText}.pdf`.replace(/\s|\/|"/gi, '_')
    return {
      url: href,
      fileName: `${bookDir}/${normalizedFileName}`
    }
  }), bookDir)

  if (!fs.existsSync(bookDir)) {
    fs.mkdirSync(bookDir)
  }

  for (let i = 0; i < pages.length; i++) {
    const { fileName, url } = pages[i]

    console.log(`Processing :: ${i} :: ${fileName}`)

    if (fs.existsSync(fileName)) {
      console.log(`Skipping, already downloaded :: ${i} :: ${fileName}`)
      continue
    }

    await page.goto(url, { waitUntil: 'networkidle2' })
    await page.pdf({
      path: fileName,
      format: 'A4',
      printBackground: true,
      margin: {
        top: pageMargin,
        left: pageMargin,
        right: pageMargin,
        bottom: pageMargin
      }
    })

    console.log(`Done with :: ${i} :: ${fileName}`)
  }

  await browser.close()

  merge(pages.map(page => page.fileName), finalOutputFilename, err => {
    if (err) {
      console.log(`Unable to merge PDFs :: ${err}`)
      return
    }

    rimraf.sync(bookDir)
    console.log(`Successfully converted and merged the PDFs as ${finalOutputFilename}!`)
  })
})()
