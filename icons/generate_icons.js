const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Helper to create a valid PNG buffer in raw Node.js without npm dependencies
function createPngBuffer(width, height, r, g, b, a = 255) {
  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression method
  ihdr[11] = 0; // Filter method
  ihdr[12] = 0; // Interlace method
  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT Chunk (Raw RGBA pixels with filter byte 0 per scanline)
  const lineSize = width * 4 + 1;
  const rawData = Buffer.alloc(height * lineSize);

  for (let y = 0; y < height; y++) {
    const lineOffset = y * lineSize;
    rawData[lineOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = lineOffset + 1 + x * 4;
      // Drawing a rounded YouTube red badge with a chat bubble / play symbol inside
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const maxR = width * 0.45;

      if (dist <= maxR) {
        // Red badge background (#FF0000)
        rawData[pixelOffset] = r;
        rawData[pixelOffset + 1] = g;
        rawData[pixelOffset + 2] = b;
        rawData[pixelOffset + 3] = a;

        // White chat bubble / play triangle in center
        if (x >= width * 0.4 && x <= width * 0.65 && y >= height * 0.35 && y <= height * 0.65) {
          // Play triangle shape
          const relX = (x - width * 0.4) / (width * 0.25);
          const relY = Math.abs(y - cy) / (height * 0.15);
          if (relY <= 1 - relX * 0.7) {
            rawData[pixelOffset] = 255;
            rawData[pixelOffset + 1] = 255;
            rawData[pixelOffset + 2] = 255;
            rawData[pixelOffset + 3] = 255;
          }
        }
      } else {
        // Transparent outside
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const bodyBuf = Buffer.concat([typeBuf, data]);

  // CRC32 Calculation
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(bodyBuf), 0);

  return Buffer.concat([len, bodyBuf, crcBuf]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xedb88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const iconsDir = __dirname;
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 48, 128].forEach(size => {
  const iconBuffer = createPngBuffer(size, size, 255, 0, 50, 255);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), iconBuffer);
  console.log(`Generated icon-${size}.png`);
});
