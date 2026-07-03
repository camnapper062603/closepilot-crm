import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const ICON_SIZES = [1024, 512, 192, 180];
const OUT_DIR = "assets";
const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

mkdirSync(OUT_DIR, { recursive: true });

for (const size of ICON_SIZES) {
  writeIcon(`${OUT_DIR}/kira-app-icon-${size}.png`, size);
}

for (const [density, size] of Object.entries(androidLauncherSizes())) {
  const basePath = `android/app/src/main/res/mipmap-${density}`;
  if (!existsSync(basePath)) continue;
  writeIcon(`${basePath}/ic_launcher.png`, size);
  writeIcon(`${basePath}/ic_launcher_round.png`, size);
  writeIcon(`${basePath}/ic_launcher_foreground.png`, Math.round(size * 2.25));
}

if (existsSync("ios/App/App/Assets.xcassets/AppIcon.appiconset")) {
  writeIcon("ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png", 1024);
}

function createIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const canonicalX = ((x + 0.5) / size) * 1024;
      const canonicalY = ((y + 0.5) / size) * 1024;
      let color = [5, 5, 5, 255];

      if (inRoundedRect(canonicalX, canonicalY, 158, 158, 708, 708, 152)) {
        color = [255, 255, 255, 255];
      }

      if (inPolygon(canonicalX, canonicalY, kiraKPath()) || inRect(canonicalX, canonicalY, 610, 300, 86, 424)) {
        color = [11, 47, 99, 255];
      }

      if (inRect(canonicalX, canonicalY, 292, 764, 404, 42)) {
        color = [7, 31, 66, 255];
      }

      const index = (y * size + x) * 4;
      pixels[index] = color[0];
      pixels[index + 1] = color[1];
      pixels[index + 2] = color[2];
      pixels[index + 3] = color[3];
    }
  }

  const scanlines = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 4 + 1);
    scanlines[rowStart] = 0;
    pixels.copy(scanlines, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr(size, size)),
    chunk("IDAT", deflateSync(scanlines, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function writeIcon(path, size) {
  writeFileSync(path, createIcon(size));
}

function androidLauncherSizes() {
  return {
    mdpi: 48,
    hdpi: 72,
    xhdpi: 96,
    xxhdpi: 144,
    xxxhdpi: 192,
  };
}

function ihdr(width, height) {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(width, 0);
  data.writeUInt32BE(height, 4);
  data[8] = 8;
  data[9] = 6;
  data[10] = 0;
  data[11] = 0;
  data[12] = 0;
  return data;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])), 0);
  return Buffer.concat([length, name, data, crc]);
}

function crc32(buffer) {
  let crc = -1;
  for (const byte of buffer) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function inRect(x, y, left, top, width, height) {
  return x >= left && x <= left + width && y >= top && y <= top + height;
}

function inRoundedRect(x, y, left, top, width, height, radius) {
  if (!inRect(x, y, left, top, width, height)) return false;
  const closestX = clamp(x, left + radius, left + width - radius);
  const closestY = clamp(y, top + radius, top + height - radius);
  return (x - closestX) ** 2 + (y - closestY) ** 2 <= radius ** 2;
}

function inPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function kiraKPath() {
  return [
    [292, 724],
    [292, 300],
    [378, 300],
    [378, 466],
    [529, 300],
    [637, 300],
    [474, 477],
    [650, 724],
    [543, 724],
    [413, 540],
    [378, 578],
    [378, 724],
  ];
}
