import { ScreeningReportDocument } from './screening-report';
import { isBarcodeScaleEstimateValue, BarcodeScaleEstimateValue, formatBarcodeScaleEstimate } from '../measurement';

// Standard A4 dimensions in points (72 points/inch)
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 36;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2; // 523.28
const MARGIN_TOP = 36;
const MARGIN_BOTTOM = 40;

// Helvetica character widths (1000ths of font size)
const CHAR_WIDTHS: Record<number, number> = {
  32: 278, 33: 278, 34: 355, 35: 556, 36: 556, 37: 889, 38: 667, 39: 191,
  40: 333, 41: 333, 42: 389, 43: 584, 44: 278, 45: 333, 46: 278, 47: 278,
  48: 556, 49: 556, 50: 556, 51: 556, 52: 556, 53: 556, 54: 556, 55: 556,
  56: 556, 57: 556, 58: 278, 59: 278, 60: 584, 61: 584, 62: 584, 63: 556,
  64: 1015, 65: 667, 66: 667, 67: 722, 68: 722, 69: 667, 70: 611, 71: 778,
  72: 722, 73: 278, 74: 500, 75: 667, 76: 556, 77: 833, 78: 722, 79: 778,
  80: 667, 81: 778, 82: 722, 83: 667, 84: 611, 85: 722, 86: 667, 87: 944,
  88: 667, 89: 667, 90: 611, 91: 278, 92: 278, 93: 278, 94: 469, 95: 556,
  96: 333, 97: 556, 98: 556, 99: 500, 100: 556, 101: 556, 102: 278, 103: 556,
  104: 556, 105: 222, 106: 222, 107: 500, 108: 222, 109: 833, 110: 556, 111: 556,
  112: 556, 113: 556, 114: 333, 115: 500, 116: 278, 117: 556, 118: 500, 119: 722,
  120: 500, 121: 500, 122: 500, 123: 334, 124: 260, 125: 334, 126: 584
};

function transliterate(val: string): string {
  return val
    .replaceAll('₹', 'Rs. ')
    .replaceAll('€', 'EUR ')
    .replaceAll('£', 'GBP ')
    .replaceAll('¥', 'JPY ')
    .replaceAll('°', ' deg')
    .replaceAll('²', '2')
    .replaceAll('³', '3')
    .replaceAll('×', 'x')
    .replaceAll('≤', '<=')
    .replaceAll('≥', '>=')
    .replaceAll('–', '-')
    .replaceAll('—', '--')
    .replaceAll('\u2018', "'")
    .replaceAll('\u2019', "'")
    .replaceAll('\u201C', '"')
    .replaceAll('\u201D', '"')
    .replaceAll('•', '*')
    .replaceAll('…', '...');
}

function escapePdf(val: string): string {
  return transliterate(val)
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)')
    .replaceAll(/[^\x20-\x7E]/g, '?');
}

export function measureText(text: string, fontSize: number, isBold = false): number {
  let total = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const baseWidth = CHAR_WIDTHS[code] ?? 500;
    total += isBold ? baseWidth * 1.05 : baseWidth;
  }
  return (total / 1000) * fontSize;
}

export function wrapText(text: string, maxWidth: number, fontSize: number, isBold = false): string[] {
  const clean = transliterate(text);
  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!word) continue;
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = measureText(testLine, fontSize, isBold);
    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      // If single word exceeds maxWidth, break it by characters
      if (measureText(word, fontSize, isBold) > maxWidth) {
        let chunk = '';
        for (let i = 0; i < word.length; i++) {
          const testChunk = chunk + word[i];
          if (measureText(testChunk, fontSize, isBold) <= maxWidth) {
            chunk = testChunk;
          } else {
            if (chunk) lines.push(chunk);
            chunk = word[i];
          }
        }
        currentLine = chunk;
      } else {
        currentLine = word;
      }
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [''];
}

type FontType = 'HELVETICA' | 'HELVETICA_BOLD' | 'HELVETICA_OBLIQUE' | 'COURIER';

const FONT_MAP: Record<FontType, string> = {
  HELVETICA: '/F1',
  HELVETICA_BOLD: '/F2',
  HELVETICA_OBLIQUE: '/F3',
  COURIER: '/F4',
};

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

function rgb(r: number, g: number, b: number): RgbColor {
  return { r: r / 255, g: g / 255, b: b / 255 };
}

// Curated palette
const PALETTE = {
  NAVY_HEADER: rgb(15, 23, 42),       // #0F172A
  BLUE_ACCENT: rgb(37, 99, 235),      // #2563EB
  BLUE_LIGHT: rgb(239, 246, 255),     // #EFF6FF
  SLATE_BG: rgb(248, 250, 252),       // #F8FAFC
  SLATE_BORDER: rgb(226, 232, 240),   // #E2E8F0
  SLATE_DIVIDER: rgb(241, 245, 249),  // #F1F5F9
  TEXT_DARK: rgb(15, 23, 42),         // #0F172A
  TEXT_SECONDARY: rgb(71, 85, 105),   // #475569
  TEXT_MUTED: rgb(148, 163, 184),     // #94A3B8
  WHITE: rgb(255, 255, 255),
  // Status Colors
  PASS_BG: rgb(240, 253, 244),        // #F0FDF4
  PASS_BORDER: rgb(187, 247, 208),    // #BBF7D0
  PASS_TEXT: rgb(21, 128, 61),        // #15803D
  FAIL_BG: rgb(254, 242, 242),        // #FEF2F2
  FAIL_BORDER: rgb(254, 202, 202),    // #FECACA
  FAIL_TEXT: rgb(185, 28, 28),        // #B91C1C
  UNCERTAIN_BG: rgb(255, 251, 235),   // #FFFBEB
  UNCERTAIN_BORDER: rgb(253, 230, 138), // #FDE68A
  UNCERTAIN_TEXT: rgb(180, 83, 9),    // #B45309
  NOT_MEASURABLE_BG: rgb(241, 245, 249),
  NOT_MEASURABLE_BORDER: rgb(203, 213, 225),
  NOT_MEASURABLE_TEXT: rgb(71, 85, 105),
  NOT_APPLICABLE_BG: rgb(243, 244, 246),
  NOT_APPLICABLE_BORDER: rgb(209, 213, 219),
  NOT_APPLICABLE_TEXT: rgb(107, 114, 128),
};

export class PdfCanvas {
  private pages: string[][] = [];
  private currentPageOps: string[] = [];

  constructor() {
    this.addPage();
  }

  addPage() {
    if (this.currentPageOps.length > 0 || this.pages.length === 0) {
      this.currentPageOps = [];
      this.pages.push(this.currentPageOps);
    }
  }

  getPageCount(): number {
    return this.pages.length;
  }

  save() {
    this.currentPageOps.push('q');
  }

  restore() {
    this.currentPageOps.push('Q');
  }

  setFillColor(color: RgbColor) {
    this.currentPageOps.push(`${color.r.toFixed(3)} ${color.g.toFixed(3)} ${color.b.toFixed(3)} rg`);
  }

  setStrokeColor(color: RgbColor) {
    this.currentPageOps.push(`${color.r.toFixed(3)} ${color.g.toFixed(3)} ${color.b.toFixed(3)} RG`);
  }

  setLineWidth(width: number) {
    this.currentPageOps.push(`${width.toFixed(2)} w`);
  }

  rect(x: number, y: number, w: number, h: number, fill = true, stroke = false) {
    const op = fill && stroke ? 'B' : fill ? 'f' : 'S';
    this.currentPageOps.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${op}`);
  }

  line(x1: number, y1: number, x2: number, y2: number) {
    this.currentPageOps.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  }

  text(str: string, x: number, y: number, options: { font?: FontType; size?: number; color?: RgbColor } = {}) {
    const font = options.font ?? 'HELVETICA';
    const size = options.size ?? 10;
    const fontRef = FONT_MAP[font];
    const escaped = escapePdf(str);

    if (options.color) {
      this.setFillColor(options.color);
    }
    this.currentPageOps.push(
      `BT ${fontRef} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${escaped}) Tj ET`
    );
  }

  /** Renders a rounded pill badge */
  badge(
    label: string,
    x: number,
    y: number,
    options: {
      bgColor: RgbColor;
      borderColor: RgbColor;
      textColor: RgbColor;
      fontSize?: number;
      paddingX?: number;
      height?: number;
    }
  ): number {
    const fontSize = options.fontSize ?? 7.5;
    const height = options.height ?? 15;
    const paddingX = options.paddingX ?? 7;
    const textW = measureText(label, fontSize, true);
    const badgeW = textW + paddingX * 2;

    this.save();
    this.setFillColor(options.bgColor);
    this.setStrokeColor(options.borderColor);
    this.setLineWidth(0.65);
    this.rect(x, y - height + 2, badgeW, height, true, true);
    this.text(label, x + paddingX, y - height + 5, {
      font: 'HELVETICA_BOLD',
      size: fontSize,
      color: options.textColor,
    });
    this.restore();

    return badgeW;
  }

  /** Appends an operation directly into page stream at index (useful for 2-pass page numbering) */
  injectIntoPage(pageIndex: number, op: string) {
    if (this.pages[pageIndex]) {
      this.pages[pageIndex].push(op);
    }
  }

  compile(): Uint8Array {
    const pageObjectsCount = this.pages.length;
    const objects: string[] = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      `<< /Type /Pages /Kids [${this.pages.map((_, i) => `${7 + i * 2} 0 R`).join(' ')}] /Count ${pageObjectsCount} >>`,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>',
    ];

    this.pages.forEach((pageOps, index) => {
      const stream = pageOps.join('\n');
      const pageNum = 7 + index * 2;
      const contentNum = 8 + index * 2;
      objects.push(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R >> >> /Contents ${contentNum} 0 R >>`
      );
      objects.push(`<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`);
    });

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets.push(new TextEncoder().encode(pdf).length);
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });

    const xrefOffset = new TextEncoder().encode(pdf).length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => {
      pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

    return new TextEncoder().encode(pdf);
  }
}

/** Status color badge config */
function getStatusStyle(status: string) {
  switch (status) {
    case 'PASS':
      return { bg: PALETTE.PASS_BG, border: PALETTE.PASS_BORDER, text: PALETTE.PASS_TEXT, label: 'PASS' };
    case 'FAIL':
      return { bg: PALETTE.FAIL_BG, border: PALETTE.FAIL_BORDER, text: PALETTE.FAIL_TEXT, label: 'FAIL' };
    case 'UNCERTAIN':
      return { bg: PALETTE.UNCERTAIN_BG, border: PALETTE.UNCERTAIN_BORDER, text: PALETTE.UNCERTAIN_TEXT, label: 'UNCERTAIN' };
    case 'NOT_MEASURABLE':
      return { bg: PALETTE.NOT_MEASURABLE_BG, border: PALETTE.NOT_MEASURABLE_BORDER, text: PALETTE.NOT_MEASURABLE_TEXT, label: 'NOT MEASURABLE' };
    case 'NOT_APPLICABLE':
    default:
      return { bg: PALETTE.NOT_APPLICABLE_BG, border: PALETTE.NOT_APPLICABLE_BORDER, text: PALETTE.NOT_APPLICABLE_TEXT, label: 'NOT APPLICABLE' };
  }
}

/** High-aesthetic PDF renderer for Maanak Digital Compliance Screening Reports */
export function renderAestheticPdfReport(report: ScreeningReportDocument): Uint8Array {
  const canvas = new PdfCanvas();
  let curY = PAGE_HEIGHT - MARGIN_TOP;

  function ensureSpace(neededHeight: number): void {
    if (curY - neededHeight < MARGIN_BOTTOM + 20) {
      canvas.addPage();
      curY = PAGE_HEIGHT - MARGIN_TOP - 24; // space below running header
      drawRunningHeader();
    }
  }

  function drawRunningHeader() {
    canvas.save();
    canvas.setStrokeColor(PALETTE.SLATE_BORDER);
    canvas.setLineWidth(0.5);
    canvas.line(MARGIN_X, PAGE_HEIGHT - MARGIN_TOP, MARGIN_X + CONTENT_WIDTH, PAGE_HEIGHT - MARGIN_TOP);

    canvas.text('MAANAK DIGITAL COMPLIANCE SCREENING', MARGIN_X, PAGE_HEIGHT - MARGIN_TOP + 5, {
      font: 'HELVETICA_BOLD',
      size: 7,
      color: PALETTE.TEXT_MUTED,
    });
    const sub = `${report.scan.productName.slice(0, 36)} | ID: ${report.scan.id.slice(0, 20)}`;
    const subW = measureText(sub, 7, false);
    canvas.text(sub, MARGIN_X + CONTENT_WIDTH - subW, PAGE_HEIGHT - MARGIN_TOP + 5, {
      font: 'HELVETICA',
      size: 7,
      color: PALETTE.TEXT_MUTED,
    });
    canvas.restore();
  }

  // ==========================================
  // PAGE 1: HERO HEADER BANNER
  // ==========================================
  const headerHeight = 64;
  canvas.save();
  // Navy banner card
  canvas.setFillColor(PALETTE.NAVY_HEADER);
  canvas.rect(MARGIN_X, curY - headerHeight, CONTENT_WIDTH, headerHeight, true, false);

  // Top accent stripe (Blue)
  canvas.setFillColor(PALETTE.BLUE_ACCENT);
  canvas.rect(MARGIN_X, curY - 3, CONTENT_WIDTH, 3, true, false);

  // Title
  canvas.text('MAANAK', MARGIN_X + 16, curY - 24, {
    font: 'HELVETICA_BOLD',
    size: 16,
    color: PALETTE.WHITE,
  });
  canvas.text('|  DIGITAL COMPLIANCE SCREENING REPORT', MARGIN_X + 96, curY - 24, {
    font: 'HELVETICA',
    size: 11,
    color: rgb(203, 213, 225),
  });

  // Subtitle
  canvas.text(
    'Preliminary Evidence-First Statutory Screening Record  -  Legal Metrology (Packaged Commodities) Rules, 2011',
    MARGIN_X + 16,
    curY - 42,
    { font: 'HELVETICA', size: 7.5, color: rgb(148, 163, 184) }
  );

  // Regulatory classification pill on right
  const badgeText = 'STATUTORY SCREENING AID';
  const badgeW = measureText(badgeText, 7, true) + 12;
  canvas.setFillColor(rgb(30, 41, 59));
  canvas.setStrokeColor(rgb(51, 65, 85));
  canvas.setLineWidth(0.6);
  canvas.rect(MARGIN_X + CONTENT_WIDTH - badgeW - 16, curY - 34, badgeW, 16, true, true);
  canvas.text(badgeText, MARGIN_X + CONTENT_WIDTH - badgeW - 10, curY - 23, {
    font: 'HELVETICA_BOLD',
    size: 7,
    color: rgb(125, 211, 252),
  });
  canvas.restore();

  curY -= headerHeight + 12;

  // ==========================================
  // METADATA CARD (2-Column Grid)
  // ==========================================
  const metaCardHeight = 62;
  canvas.save();
  canvas.setFillColor(PALETTE.SLATE_BG);
  canvas.setStrokeColor(PALETTE.SLATE_BORDER);
  canvas.setLineWidth(0.6);
  canvas.rect(MARGIN_X, curY - metaCardHeight, CONTENT_WIDTH, metaCardHeight, true, true);

  const col1X = MARGIN_X + 16;
  const col2X = MARGIN_X + CONTENT_WIDTH / 2 + 10;
  const row1Y = curY - 16;
  const row2Y = curY - 32;
  const row3Y = curY - 48;

  // Row 1
  canvas.text('Product Name:', col1X, row1Y, { font: 'HELVETICA_BOLD', size: 8, color: PALETTE.TEXT_SECONDARY });
  canvas.text(report.scan.productName.slice(0, 42), col1X + 72, row1Y, { font: 'HELVETICA_BOLD', size: 8.5, color: PALETTE.TEXT_DARK });

  canvas.text('Generated At:', col2X, row1Y, { font: 'HELVETICA_BOLD', size: 8, color: PALETTE.TEXT_SECONDARY });
  canvas.text(report.generatedAt.replace('T', ' ').slice(0, 19) + ' UTC', col2X + 68, row1Y, { font: 'HELVETICA', size: 8, color: PALETTE.TEXT_DARK });

  // Row 2
  canvas.text('Scan ID:', col1X, row2Y, { font: 'HELVETICA_BOLD', size: 8, color: PALETTE.TEXT_SECONDARY });
  canvas.text(report.scan.id, col1X + 72, row2Y, { font: 'COURIER', size: 8, color: PALETTE.TEXT_DARK });

  canvas.text('Source Type:', col2X, row2Y, { font: 'HELVETICA_BOLD', size: 8, color: PALETTE.TEXT_SECONDARY });
  canvas.text(`${report.scan.sourceType} (${report.scan.mode})`, col2X + 68, row2Y, { font: 'HELVETICA', size: 8, color: PALETTE.TEXT_DARK });

  // Row 3
  canvas.text('Ruleset Version:', col1X, row3Y, { font: 'HELVETICA_BOLD', size: 8, color: PALETTE.TEXT_SECONDARY });
  canvas.text(report.scan.ruleVersion.slice(0, 36), col1X + 72, row3Y, { font: 'HELVETICA', size: 7.5, color: PALETTE.TEXT_DARK });

  canvas.text('Evidence Images:', col2X, row3Y, { font: 'HELVETICA_BOLD', size: 8, color: PALETTE.TEXT_SECONDARY });
  canvas.text(`${report.evidenceImages.length} image(s) registered`, col2X + 68, row3Y, { font: 'HELVETICA', size: 8, color: PALETTE.TEXT_DARK });

  canvas.restore();
  curY -= metaCardHeight + 12;

  // ==========================================
  // EXECUTIVE SUMMARY CALLOUT BOX
  // ==========================================
  const overall = report.canonicalResult.overallResult;
  const overallStyle = getStatusStyle(overall);
  const summaryCardHeight = 56;

  canvas.save();
  canvas.setFillColor(overallStyle.bg);
  canvas.setStrokeColor(overallStyle.border);
  canvas.setLineWidth(0.85);
  canvas.rect(MARGIN_X, curY - summaryCardHeight, CONTENT_WIDTH, summaryCardHeight, true, true);

  // Left status pill
  const pillW = canvas.badge(overall, MARGIN_X + 16, curY - 14, {
    bgColor: overallStyle.bg,
    borderColor: overallStyle.border,
    textColor: overallStyle.text,
    fontSize: 10,
    height: 20,
    paddingX: 12,
  });

  // Overall text description
  let summaryText = 'All verified statutory requirements satisfied the preliminary screening rules.';
  if (overall === 'FAIL') {
    summaryText = 'One or more mandatory statutory declarations were violated or not detected in available evidence.';
  } else if (overall === 'UNCERTAIN') {
    summaryText = 'Evidence quality or observation ambiguity requires manual physical sample inspection by an officer.';
  } else if (overall === 'NOT_MEASURABLE') {
    summaryText = 'Physical measurements could not be certified from 2D images without a calibrated scale reference.';
  }

  canvas.text('Overall Screening Verdict:', MARGIN_X + 16 + pillW + 12, curY - 18, {
    font: 'HELVETICA_BOLD',
    size: 9.5,
    color: overallStyle.text,
  });
  canvas.text(summaryText, MARGIN_X + 16 + pillW + 12, curY - 32, {
    font: 'HELVETICA',
    size: 8,
    color: PALETTE.TEXT_SECONDARY,
  });

  // Metrics count line
  const passedCount = report.canonicalResult.evaluations.filter((e) => e.result === 'PASS').length;
  const failedCount = report.canonicalResult.evaluations.filter((e) => e.result === 'FAIL').length;
  const uncertainCount = report.canonicalResult.evaluations.filter((e) => e.result === 'UNCERTAIN').length;
  const notMeasurableCount = report.canonicalResult.evaluations.filter((e) => e.result === 'NOT_MEASURABLE').length;

  const metricsText = `Evaluations: ${report.canonicalResult.evaluations.length}  |  Passed: ${passedCount}  |  Non-Compliant: ${failedCount}  |  Uncertain: ${uncertainCount}  |  Unmeasurable: ${notMeasurableCount}`;
  canvas.text(metricsText, MARGIN_X + 16, curY - 48, {
    font: 'HELVETICA_BOLD',
    size: 7.5,
    color: PALETTE.TEXT_SECONDARY,
  });

  canvas.restore();
  curY -= summaryCardHeight + 16;

  // ==========================================
  // SECTION: RULE EVALUATIONS
  // ==========================================
  ensureSpace(40);
  canvas.save();
  // Section heading with vertical blue bar
  canvas.setFillColor(PALETTE.BLUE_ACCENT);
  canvas.rect(MARGIN_X, curY - 13, 3.5, 14, true, false);
  canvas.text('STATUTORY RULE EVALUATIONS (LMPC RULES, 2011)', MARGIN_X + 9, curY - 12, {
    font: 'HELVETICA_BOLD',
    size: 10,
    color: PALETTE.NAVY_HEADER,
  });
  canvas.restore();
  curY -= 22;

  // Render each evaluation as an executive card
  for (const evaluation of report.canonicalResult.evaluations) {
    const rule = report.ruleMetadata.find((r) => r.id === evaluation.ruleId);
    const explanation = report.explanations.find((e) => e.evaluationId === evaluation.id);
    const evalStyle = getStatusStyle(evaluation.result);

    // Calculate dynamic card height based on wrapped lines
    const titleText = rule?.title ?? evaluation.ruleId;
    const reasonLines = wrapText(`Finding: ${evaluation.reason}`, CONTENT_WIDTH - 24, 7.5, false);
    const explanationLines = explanation?.text
      ? wrapText(`Explanation: ${explanation.text}`, CONTENT_WIDTH - 24, 7.5, false)
      : [];

    const baseHeight = 52;
    const textExtra = (reasonLines.length - 1) * 9 + (explanationLines.length > 0 ? explanationLines.length * 9 + 4 : 0);
    const cardHeight = baseHeight + textExtra;

    ensureSpace(cardHeight + 8);

    canvas.save();
    // Card background & border
    canvas.setFillColor(PALETTE.WHITE);
    canvas.setStrokeColor(PALETTE.SLATE_BORDER);
    canvas.setLineWidth(0.6);
    canvas.rect(MARGIN_X, curY - cardHeight, CONTENT_WIDTH, cardHeight, true, true);

    // Card top title & badge
    canvas.text(titleText, MARGIN_X + 12, curY - 14, {
      font: 'HELVETICA_BOLD',
      size: 9,
      color: PALETTE.TEXT_DARK,
    });

    const badgeWidth = canvas.badge(evaluation.result, MARGIN_X + CONTENT_WIDTH - 74, curY - 7, {
      bgColor: evalStyle.bg,
      borderColor: evalStyle.border,
      textColor: evalStyle.text,
      fontSize: 7.5,
      height: 14,
      paddingX: 8,
    });

    // Subtitle: Rule ID & Citation
    const citation = `Rule ID: ${evaluation.ruleId}  -  Source: ${rule?.source ?? 'LMPC Rules 2011'} (v: ${evaluation.ruleVersion})`;
    canvas.text(citation.slice(0, 85), MARGIN_X + 12, curY - 26, {
      font: 'HELVETICA',
      size: 7,
      color: PALETTE.TEXT_MUTED,
    });

    // Reason line(s)
    let textCursorY = curY - 37;
    for (const rLine of reasonLines) {
      canvas.text(rLine, MARGIN_X + 12, textCursorY, {
        font: 'HELVETICA',
        size: 7.5,
        color: PALETTE.TEXT_DARK,
      });
      textCursorY -= 9;
    }

    // Explanation line(s)
    if (explanationLines.length > 0) {
      textCursorY -= 2;
      for (const eLine of explanationLines) {
        canvas.text(eLine, MARGIN_X + 12, textCursorY, {
          font: 'HELVETICA_OBLIQUE',
          size: 7.5,
          color: PALETTE.TEXT_SECONDARY,
        });
        textCursorY -= 9;
      }
    }

    // Traceability metadata strip at card bottom
    const confText = evaluation.observationConfidence !== null ? `${Math.round(evaluation.observationConfidence * 100)}%` : 'N/A';
    const evidenceText = evaluation.evidence?.imageId ? `Evidence: ${evaluation.evidence.imageId}` : 'Evidence: Not localized';
    const bboxText = evaluation.evidence?.boundingBox ? `BBox: [${evaluation.evidence.boundingBox.x.toFixed(2)}, ${evaluation.evidence.boundingBox.y.toFixed(2)}, ${evaluation.evidence.boundingBox.width.toFixed(2)}, ${evaluation.evidence.boundingBox.height.toFixed(2)}]` : '';
    const traceLine = `${evidenceText}  |  Confidence: ${confText}  ${bboxText ? `|  ${bboxText}` : ''}`;

    canvas.text(traceLine, MARGIN_X + 12, curY - cardHeight + 8, {
      font: 'COURIER',
      size: 6.8,
      color: PALETTE.TEXT_MUTED,
    });

    canvas.restore();
    curY -= cardHeight + 7;
  }

  // ==========================================
  // SECTION: BARCODE ESTIMATES (IF PRESENT)
  // ==========================================
  const barcodeObs = report.observations.filter((obs) => isBarcodeScaleEstimateValue(obs.value));
  if (barcodeObs.length > 0) {
    ensureSpace(60);
    curY -= 6;
    canvas.save();
    canvas.setFillColor(PALETTE.UNCERTAIN_TEXT);
    canvas.rect(MARGIN_X, curY - 13, 3.5, 14, true, false);
    canvas.text('BARCODE-BASED SCALE ESTIMATES (INNOV-001 INNOVATION FEATURE)', MARGIN_X + 9, curY - 12, {
      font: 'HELVETICA_BOLD',
      size: 9.5,
      color: PALETTE.NAVY_HEADER,
    });
    canvas.restore();
    curY -= 20;

    for (const bObs of barcodeObs) {
      const bVal = bObs.value as BarcodeScaleEstimateValue;
      const bHeight = 54;
      ensureSpace(bHeight + 6);

      canvas.save();
      canvas.setFillColor(PALETTE.UNCERTAIN_BG);
      canvas.setStrokeColor(PALETTE.UNCERTAIN_BORDER);
      canvas.setLineWidth(0.6);
      canvas.rect(MARGIN_X, curY - bHeight, CONTENT_WIDTH, bHeight, true, true);

      canvas.text(`Screening Estimate: Barcode Format ${bVal.barcodeFormat ?? 'EAN_13'} (Confidence: ${Math.round(bObs.confidence * 100)}%)`, MARGIN_X + 12, curY - 14, {
        font: 'HELVETICA_BOLD',
        size: 8.5,
        color: PALETTE.UNCERTAIN_TEXT,
      });

      canvas.text(
        'Note: Barcode-derived measurements are indicative screening references only and must not be used as certified legal measurement.',
        MARGIN_X + 12,
        curY - 26,
        { font: 'HELVETICA_OBLIQUE', size: 7.2, color: PALETTE.TEXT_SECONDARY }
      );

      const assumptions = `Assumptions: ${(bVal.assumptions || []).join('; ') || 'Standard nominal GS1 dimensions applied.'}`;
      canvas.text(assumptions.slice(0, 105), MARGIN_X + 12, curY - 38, {
        font: 'HELVETICA',
        size: 7,
        color: PALETTE.TEXT_DARK,
      });

      const limitations = `Limitations: ${(bVal.limitations || []).join('; ') || 'Planar perspective assumption; subject to package curvature.'}`;
      canvas.text(limitations.slice(0, 105), MARGIN_X + 12, curY - 48, {
        font: 'HELVETICA',
        size: 7,
        color: PALETTE.TEXT_MUTED,
      });

      canvas.restore();
      curY -= bHeight + 8;
    }
  }

  // ==========================================
  // SECTION: OBSERVATIONS TABLE
  // ==========================================
  ensureSpace(70);
  curY -= 6;
  canvas.save();
  canvas.setFillColor(PALETTE.BLUE_ACCENT);
  canvas.rect(MARGIN_X, curY - 13, 3.5, 14, true, false);
  canvas.text('STRUCTURED VISION OBSERVATIONS', MARGIN_X + 9, curY - 12, {
    font: 'HELVETICA_BOLD',
    size: 9.5,
    color: PALETTE.NAVY_HEADER,
  });
  canvas.restore();
  curY -= 20;

  // Table header
  canvas.save();
  canvas.setFillColor(PALETTE.SLATE_BG);
  canvas.setStrokeColor(PALETTE.SLATE_BORDER);
  canvas.setLineWidth(0.5);
  canvas.rect(MARGIN_X, curY - 16, CONTENT_WIDTH, 16, true, true);

  canvas.text('DECLARATION FIELD', MARGIN_X + 10, curY - 11, { font: 'HELVETICA_BOLD', size: 7.5, color: PALETTE.TEXT_SECONDARY });
  canvas.text('STATUS', MARGIN_X + 140, curY - 11, { font: 'HELVETICA_BOLD', size: 7.5, color: PALETTE.TEXT_SECONDARY });
  canvas.text('EXTRACTED VALUE', MARGIN_X + 225, curY - 11, { font: 'HELVETICA_BOLD', size: 7.5, color: PALETTE.TEXT_SECONDARY });
  canvas.text('CONFIDENCE', MARGIN_X + 375, curY - 11, { font: 'HELVETICA_BOLD', size: 7.5, color: PALETTE.TEXT_SECONDARY });
  canvas.text('IMAGE REF', MARGIN_X + 445, curY - 11, { font: 'HELVETICA_BOLD', size: 7.5, color: PALETTE.TEXT_SECONDARY });
  canvas.restore();
  curY -= 17;

  // Table rows
  for (const obs of report.observations) {
    ensureSpace(16);
    canvas.save();
    canvas.setStrokeColor(PALETTE.SLATE_DIVIDER);
    canvas.setLineWidth(0.5);
    canvas.line(MARGIN_X, curY - 14, MARGIN_X + CONTENT_WIDTH, curY - 14);

    const valStr = typeof obs.value === 'object' && obs.value !== null
      ? isBarcodeScaleEstimateValue(obs.value)
        ? formatBarcodeScaleEstimate(obs.value).slice(0, 26)
        : JSON.stringify(obs.value).slice(0, 26)
      : String(obs.value ?? 'no value').slice(0, 26);

    const statusStyle = getStatusStyle(obs.status);

    canvas.text(obs.field.slice(0, 24), MARGIN_X + 10, curY - 10, { font: 'HELVETICA_BOLD', size: 7.5, color: PALETTE.TEXT_DARK });
    canvas.text(obs.status, MARGIN_X + 140, curY - 10, { font: 'HELVETICA_BOLD', size: 7, color: statusStyle.text });
    canvas.text(valStr, MARGIN_X + 225, curY - 10, { font: 'HELVETICA', size: 7.5, color: PALETTE.TEXT_DARK });
    canvas.text(`${Math.round(obs.confidence * 100)}%`, MARGIN_X + 375, curY - 10, { font: 'HELVETICA', size: 7.5, color: PALETTE.TEXT_SECONDARY });
    canvas.text((obs.evidence?.imageId ?? 'none').slice(0, 14), MARGIN_X + 445, curY - 10, { font: 'COURIER', size: 7, color: PALETTE.TEXT_MUTED });

    canvas.restore();
    curY -= 15;
  }

  // ==========================================
  // SECTION: STATUTORY DISCLAIMER & LIMITATIONS
  // ==========================================
  const disclaimerLines = wrapText(report.disclaimer, CONTENT_WIDTH - 24, 7, false);
  const limitationsLines = report.limitations.flatMap((lim) => wrapText(`* ${lim}`, CONTENT_WIDTH - 24, 7, false));
  const disclaimerBoxHeight = 36 + (disclaimerLines.length + limitationsLines.length) * 8.5;

  ensureSpace(disclaimerBoxHeight + 10);
  curY -= 12;

  canvas.save();
  canvas.setFillColor(PALETTE.SLATE_BG);
  canvas.setStrokeColor(PALETTE.SLATE_BORDER);
  canvas.setLineWidth(0.65);
  canvas.rect(MARGIN_X, curY - disclaimerBoxHeight, CONTENT_WIDTH, disclaimerBoxHeight, true, true);

  // Red/amber vertical warning line
  canvas.setFillColor(rgb(225, 29, 72));
  canvas.rect(MARGIN_X, curY - disclaimerBoxHeight, 3.5, disclaimerBoxHeight, true, false);

  canvas.text('LEGAL DISCLAIMER & STATUTORY SCREENING BOUNDARIES', MARGIN_X + 12, curY - 14, {
    font: 'HELVETICA_BOLD',
    size: 8,
    color: PALETTE.NAVY_HEADER,
  });

  let dCursor = curY - 25;
  for (const dLine of disclaimerLines) {
    canvas.text(dLine, MARGIN_X + 12, dCursor, {
      font: 'HELVETICA',
      size: 7,
      color: PALETTE.TEXT_SECONDARY,
    });
    dCursor -= 8.5;
  }

  if (limitationsLines.length > 0) {
    dCursor -= 3;
    canvas.text('Operational Limitations:', MARGIN_X + 12, dCursor, {
      font: 'HELVETICA_BOLD',
      size: 7,
      color: PALETTE.TEXT_SECONDARY,
    });
    dCursor -= 8.5;
    for (const lLine of limitationsLines) {
      canvas.text(lLine, MARGIN_X + 12, dCursor, {
        font: 'HELVETICA',
        size: 6.8,
        color: PALETTE.TEXT_MUTED,
      });
      dCursor -= 8.5;
    }
  }

  canvas.restore();
  curY -= disclaimerBoxHeight;

  // ==========================================
  // PASS 2: INJECT RUNNING FOOTERS ON ALL PAGES
  // ==========================================
  const totalPages = canvas.getPageCount();
  for (let i = 0; i < totalPages; i++) {
    const footerY = MARGIN_BOTTOM - 14;
    const dividerOp = `q 0.886 0.910 0.941 RG 0.50 w ${MARGIN_X.toFixed(2)} ${(footerY + 12).toFixed(2)} m ${(MARGIN_X + CONTENT_WIDTH).toFixed(2)} ${(footerY + 12).toFixed(2)} l S Q`;
    const leftFooter = 'Maanak Digital Compliance Screening  -  Confidential Screening Output  -  Not an official inspection certificate';
    const leftOp = `BT /F1 7 Tf 0.580 0.639 0.722 rg ${MARGIN_X.toFixed(2)} ${footerY.toFixed(2)} Td (${escapePdf(leftFooter)}) Tj ET`;
    const rightFooter = `Page ${i + 1} of ${totalPages}`;
    const rightW = measureText(rightFooter, 7, false);
    const rightOp = `BT /F1 7 Tf 0.580 0.639 0.722 rg ${(MARGIN_X + CONTENT_WIDTH - rightW).toFixed(2)} ${footerY.toFixed(2)} Td (${escapePdf(rightFooter)}) Tj ET`;

    canvas.injectIntoPage(i, dividerOp);
    canvas.injectIntoPage(i, leftOp);
    canvas.injectIntoPage(i, rightOp);
  }

  return canvas.compile();
}
