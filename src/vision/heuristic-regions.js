import { clampBox, clampNumber, dedupeCandidates } from "../domain/geometry.js";

function buildIntegralScores(cellScores) {
  const rows = cellScores.length;
  const cols = cellScores[0]?.length || 0;
  const integral = Array.from({ length: rows + 1 }, () => Array(cols + 1).fill(0));
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      integral[row + 1][col + 1] = cellScores[row][col]
        + integral[row][col + 1]
        + integral[row + 1][col]
        - integral[row][col];
    }
  }
  return integral;
}

function sumGridWindow(integral, row, col, height, width) {
  return integral[row + height][col + width]
    - integral[row][col + width]
    - integral[row + height][col]
    + integral[row][col];
}

function proposeRegionsFromGrid(cellScores, gridCols, gridRows) {
  const integral = buildIntegralScores(cellScores);
  const windowSizes = [
    [3, 3],
    [4, 3],
    [3, 4],
    [4, 4],
    [5, 4],
    [4, 5],
    [6, 4],
    [4, 6],
  ];
  const proposals = [];
  for (const [windowCols, windowRows] of windowSizes) {
    if (windowCols > gridCols || windowRows > gridRows) continue;
    for (let row = 0; row <= gridRows - windowRows; row += 1) {
      for (let col = 0; col <= gridCols - windowCols; col += 1) {
        const area = windowCols * windowRows;
        const score = sumGridWindow(integral, row, col, windowRows, windowCols) / Math.sqrt(area);
        proposals.push({
          score,
          box: clampBox({
            x: (col / gridCols) * 100,
            y: (row / gridRows) * 100,
            w: (windowCols / gridCols) * 100,
            h: (windowRows / gridRows) * 100,
          }),
        });
      }
    }
  }

  const scored = proposals
    .sort((a, b) => b.score - a.score)
    .slice(0, 80)
    .map((proposal, index) => ({
      name: getUnknownObjectName(index),
      category: "daily",
      qty: 1,
      expireAt: "",
      nextAt: "",
      nextLabel: "",
      container: "",
      box: proposal.box,
      confidence: clampNumber(0.35 + Math.min(0.48, proposal.score / 110), 0.35, 0.83),
      source: "local-image",
      namingStatus: "loading",
    }));

  return dedupeCandidates(scored, 8, 0.34)
    .map((candidate, index) => ({
      ...candidate,
      name: getUnknownObjectName(index),
    }));
}

function getUnknownObjectName(index) {
  let number = index + 1;
  let suffix = "";
  while (number > 0) {
    number -= 1;
    suffix = String.fromCharCode(65 + (number % 26)) + suffix;
    number = Math.floor(number / 26);
  }
  return `物品${suffix}`;
}

async function recognizeWithHeuristicRegions(image, { loadImage }) {
  const source = await loadImage(image);
  const maxWidth = 180;
  const width = maxWidth;
  const height = Math.max(1, Math.round((source.naturalHeight / source.naturalWidth) * width));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(source, 0, 0, width, height);
  const { data } = context.getImageData(0, 0, width, height);
  const gridCols = 18;
  const gridRows = Math.max(10, Math.round((height / width) * gridCols));
  const cellScores = Array.from({ length: gridRows }, () => Array(gridCols).fill(0));
  const grayscale = new Float32Array(width * height);
  const saturation = new Float32Array(width * height);

  for (let index = 0; index < width * height; index += 1) {
    const offset = index * 4;
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    grayscale[index] = red * 0.299 + green * 0.587 + blue * 0.114;
    saturation[index] = max ? (max - min) / max : 0;
  }

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const edge = Math.abs(grayscale[index] - grayscale[index - 1])
        + Math.abs(grayscale[index] - grayscale[index + 1])
        + Math.abs(grayscale[index] - grayscale[index - width])
        + Math.abs(grayscale[index] - grayscale[index + width]);
      const score = edge / 255 + saturation[index] * 0.8;
      const col = Math.min(gridCols - 1, Math.floor((x / width) * gridCols));
      const row = Math.min(gridRows - 1, Math.floor((y / height) * gridRows));
      cellScores[row][col] += score;
    }
  }

  return {
    provider: "local-image",
    candidates: proposeRegionsFromGrid(cellScores, gridCols, gridRows),
  };
}

export function createHeuristicRegionRecognizer({ loadImage }) {
  return {
    recognizeWithHeuristicRegions: (image) => recognizeWithHeuristicRegions(image, { loadImage }),
  };
}
