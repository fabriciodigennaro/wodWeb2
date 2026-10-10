const sharp = require('sharp');
const fs = require('fs');

const svgPath = 'public/favicon-main.svg';
const icoPath = 'public/favicon.ico';

const sizes = [16, 32, 48, 64, 128, 256];

async function generateFavicon() {
  try {
    const svgBuffer = fs.readFileSync(svgPath);
    
    const pngBuffers = await Promise.all(
      sizes.map(size => 
        sharp(svgBuffer)
          .resize(size, size, { fit: 'contain', background: { r: 12, g: 14, b: 10, alpha: 1 } })
          .png()
          .toBuffer()
      )
    );

    // sharp doesn't directly support ICO, so we'll create a simple ICO header manually
    // For simplicity, we'll use the largest PNG as favicon.ico (modern browsers accept PNG as .ico)
    // Or we can create a proper ICO with multiple sizes
    
    // Create a proper ICO file with multiple sizes
    const icoHeader = Buffer.alloc(6);
    icoHeader.writeUInt16LE(0, 0); // Reserved
    icoHeader.writeUInt16LE(1, 2); // Type: 1 = ICO
    icoHeader.writeUInt16LE(sizes.length, 4); // Number of images

    const imageHeaders = [];
    let offset = 6 + sizes.length * 16;
    
    for (let i = 0; i < sizes.length; i++) {
      const png = pngBuffers[i];
      const header = Buffer.alloc(16);
      header.writeUInt8(sizes[i] === 256 ? 0 : sizes[i], 0); // Width (0 = 256)
      header.writeUInt8(sizes[i] === 256 ? 0 : sizes[i], 1); // Height (0 = 256)
      header.writeUInt8(0, 2); // Color palette
      header.writeUInt8(0, 3); // Reserved
      header.writeUInt16LE(1, 4); // Color planes
      header.writeUInt16LE(32, 6); // Bits per pixel
      header.writeUInt32LE(png.length, 8); // Image size
      header.writeUInt32LE(offset, 12); // Offset
      imageHeaders.push(header);
      offset += png.length;
    }

    const icoBuffer = Buffer.concat([icoHeader, ...imageHeaders, ...pngBuffers]);
    fs.writeFileSync(icoPath, icoBuffer);
    console.log('Favicon.ico generated successfully with sizes:', sizes.join(', '));
  } catch (err) {
    console.error('Error generating favicon:', err);
    process.exit(1);
  }
}

generateFavicon();