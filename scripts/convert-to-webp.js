const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const imagesDir = path.resolve(__dirname, '../docs/public/images')
const docsDir = path.resolve(__dirname, '../docs')

async function convertPngToWebp(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  let converted = 0
  let savedBytes = 0

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const result = await convertPngToWebp(fullPath)
      converted += result.converted
      savedBytes += result.savedBytes
    } else if (entry.name.toLowerCase().endsWith('.png')) {
      const webpPath = fullPath.replace(/\.png$/i, '.webp')
      const pngSize = fs.statSync(fullPath).size

      await sharp(fullPath)
        .webp({ quality: 80 })
        .toFile(webpPath)

      const webpSize = fs.statSync(webpPath).size
      savedBytes += pngSize - webpSize
      converted++

      const relPath = path.relative(imagesDir, fullPath)
      console.log(`  ${relPath}: ${(pngSize / 1024).toFixed(0)}K → ${(webpSize / 1024).toFixed(0)}K`)
    }
  }

  return { converted, savedBytes }
}

function updateMarkdownRefs(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  let filesUpdated = 0

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      filesUpdated += updateMarkdownRefs(fullPath)
    } else if (entry.name.endsWith('.md')) {
      let content = fs.readFileSync(fullPath, 'utf-8')
      const updated = content.replace(/\.png\b/gi, '.webp')
      if (content !== updated) {
        fs.writeFileSync(fullPath, updated, 'utf-8')
        const relPath = path.relative(docsDir, fullPath)
        console.log(`  Updated: ${relPath}`)
        filesUpdated++
      }
    }
  }

  return filesUpdated
}

async function main() {
  console.log('Converting PNG → WebP...\n')
  const { converted, savedBytes } = await convertPngToWebp(imagesDir)
  console.log(`\nConverted ${converted} images, saved ${(savedBytes / 1024 / 1024).toFixed(1)} MB`)

  console.log('\nUpdating markdown references...\n')
  const filesUpdated = updateMarkdownRefs(docsDir)
  console.log(`\nUpdated ${filesUpdated} markdown files`)

  console.log('\nDone! Original PNG files are kept as backup.')
}

main().catch(console.error)
