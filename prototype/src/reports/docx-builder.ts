import { ScreeningReportDocument } from './screening-report';
import { isBarcodeScaleEstimateValue, formatBarcodeScaleEstimate } from '../measurement';

// Pre-computed IEEE 802.3 CRC32 lookup table
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC_TABLE[i] = c;
}

function calculateCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

interface ZipEntry {
  path: string;
  data: Uint8Array;
}

/**
 * Builds an uncompressed ZIP archive (Method 0: STORE).
 * Fully valid standard PKZIP accepted by MS Word, LibreOffice, and Google Docs.
 */
function buildZip(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const fileRecords: {
    pathBytes: Uint8Array;
    data: Uint8Array;
    crc: number;
    offset: number;
  }[] = [];

  let currentOffset = 0;
  const localHeaderChunks: Uint8Array[] = [];

  for (const entry of entries) {
    const pathBytes = encoder.encode(entry.path);
    const crc = calculateCrc32(entry.data);
    const offset = currentOffset;

    // Local file header: 30 bytes + path length + data length
    const header = new Uint8Array(30 + pathBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true); // Local file header signature
    view.setUint16(4, 20, true);         // Version needed to extract (2.0)
    view.setUint16(6, 0, true);          // General purpose bit flag
    view.setUint16(8, 0, true);          // Compression method (0 = STORE)
    view.setUint16(10, 0x5421, true);    // Last mod file time
    view.setUint16(12, 0x5421, true);    // Last mod file date
    view.setUint32(14, crc, true);       // CRC-32
    view.setUint32(18, entry.data.length, true); // Compressed size
    view.setUint32(22, entry.data.length, true); // Uncompressed size
    view.setUint16(26, pathBytes.length, true);  // File name length
    view.setUint16(28, 0, true);                 // Extra field length
    header.set(pathBytes, 30);

    localHeaderChunks.push(header, entry.data);
    fileRecords.push({ pathBytes, data: entry.data, crc, offset });
    currentOffset += header.length + entry.data.length;
  }

  const centralDirectoryOffset = currentOffset;
  const centralDirectoryChunks: Uint8Array[] = [];

  for (const record of fileRecords) {
    // Central directory header: 46 bytes + path length
    const header = new Uint8Array(46 + record.pathBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x02014b50, true); // Central directory signature
    view.setUint16(4, 20, true);         // Version made by
    view.setUint16(6, 20, true);         // Version needed to extract
    view.setUint16(8, 0, true);          // General purpose bit flag
    view.setUint16(10, 0, true);         // Compression method
    view.setUint16(12, 0x5421, true);    // Last mod time
    view.setUint16(14, 0x5421, true);    // Last mod date
    view.setUint32(16, record.crc, true);       // CRC-32
    view.setUint32(20, record.data.length, true); // Compressed size
    view.setUint32(24, record.data.length, true); // Uncompressed size
    view.setUint16(28, record.pathBytes.length, true); // File name length
    view.setUint16(30, 0, true);         // Extra field length
    view.setUint16(32, 0, true);         // File comment length
    view.setUint16(34, 0, true);         // Disk number start
    view.setUint16(36, 0, true);         // Internal file attributes
    view.setUint32(38, 0, true);         // External file attributes
    view.setUint32(42, record.offset, true); // Relative offset of local header
    header.set(record.pathBytes, 46);
    centralDirectoryChunks.push(header);
    currentOffset += header.length;
  }

  const centralDirectorySize = currentOffset - centralDirectoryOffset;

  // End of central directory record: 22 bytes
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true); // EOCD signature
  eocdView.setUint16(4, 0, true);          // Number of this disk
  eocdView.setUint16(6, 0, true);          // Disk where central directory starts
  eocdView.setUint16(8, fileRecords.length, true);  // Records on this disk
  eocdView.setUint16(10, fileRecords.length, true); // Total records
  eocdView.setUint32(12, centralDirectorySize, true);    // Size of central directory
  eocdView.setUint32(16, centralDirectoryOffset, true); // Offset to central directory
  eocdView.setUint16(20, 0, true);         // Comment length

  const totalLength = currentOffset + eocd.length;
  const result = new Uint8Array(totalLength);
  let pos = 0;

  for (const chunk of localHeaderChunks) {
    result.set(chunk, pos);
    pos += chunk.length;
  }
  for (const chunk of centralDirectoryChunks) {
    result.set(chunk, pos);
    pos += chunk.length;
  }
  result.set(eocd, pos);

  return result;
}

function escapeXml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function p(text: string, options: { bold?: boolean; color?: string; size?: number; spaceAfter?: number } = {}): string {
  const rPrParts: string[] = [];
  if (options.bold) rPrParts.push('<w:b/>');
  if (options.color) rPrParts.push(`<w:color w:val="${options.color}"/>`);
  if (options.size) rPrParts.push(`<w:sz w:val="${options.size}"/>`);
  const rPr = rPrParts.length > 0 ? `<w:rPr>${rPrParts.join('')}</w:rPr>` : '';
  const pPr = options.spaceAfter ? `<w:pPr><w:spacing w:after="${options.spaceAfter}"/></w:pPr>` : '';
  return `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

function tableCell(paragraphs: string[], widthTwips: number, bgColor?: string): string {
  const shd = bgColor ? `<w:shd w:val="clear" w:color="auto" w:fill="${bgColor}"/>` : '';
  const tcPr = `<w:tcPr><w:tcW w:w="${widthTwips}" w:type="dxa"/>${shd}<w:tcMar><w:top w:w="120" w:type="dxa"/><w:left w:w="140" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:right w:w="140" w:type="dxa"/></w:tcMar></w:tcPr>`;
  return `<w:tc>${tcPr}${paragraphs.join('')}</w:tc>`;
}

/**
 * Builds an OpenXML (.docx) editable compliance report document.
 */
export function renderDocxReport(report: ScreeningReportDocument): Uint8Array {
  const encoder = new TextEncoder();

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  // Build body paragraphs and tables
  const bodyXml: string[] = [];

  // Title & Header
  bodyXml.push(p('MAANAK - PACKAGED COMMODITIES SCREENING REPORT', { bold: true, size: 32, color: '1E3A8A', spaceAfter: 80 }));
  bodyXml.push(p('Digital Compliance Screening Report (Editable DOCX Format)', { bold: true, size: 22, color: '475569', spaceAfter: 180 }));

  // Disclaimer Box
  bodyXml.push(
    '<w:tbl>' +
    '<w:tblPr><w:tblW w:w="9360" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="6" w:space="0" w:color="F59E0B"/><w:bottom w:val="single" w:sz="6" w:space="0" w:color="F59E0B"/><w:left w:val="single" w:sz="6" w:space="0" w:color="F59E0B"/><w:right w:val="single" w:sz="6" w:space="0" w:color="F59E0B"/></w:tblBorders></w:tblPr>' +
    '<w:tr>' +
    tableCell([
      p('STATUTORY SCREENING DISCLAIMER', { bold: true, size: 18, color: '92400E', spaceAfter: 60 }),
      p(report.disclaimer, { size: 16, color: '78350F' }),
    ], 9360, 'FEF3C7') +
    '</w:tr>' +
    '</w:tbl>'
  );
  bodyXml.push(p('', { spaceAfter: 180 }));

  // Overview Table
  bodyXml.push(p('1. SCAN IDENTIFICATION & OVERVIEW', { bold: true, size: 22, color: '0F172A', spaceAfter: 100 }));
  const categoryStr = report.scan.commodityCategory ? report.scan.commodityCategory.replace('_', ' ') : 'GENERAL RETAIL';
  const overviewRows = [
    ['Product Name', report.scan.productName],
    ['Scan Reference ID', report.scan.id],
    ['Commodity Category', categoryStr],
    ['Inspection Source', report.scan.sourceType.replace('_', ' ')],
    ['Rule Version', `${report.scan.ruleVersion} (${report.canonicalResult.evaluations.length} evaluations)`],
    ['Screening Result', `${report.canonicalResult.overallResult} (Derived deterministically)`],
    ['Generated Timestamp', report.generatedAt],
  ];

  bodyXml.push(
    '<w:tbl>' +
    '<w:tblPr><w:tblW w:w="9360" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/><w:insideV w:val="none"/></w:tblBorders></w:tblPr>' +
    overviewRows.map(([k, v]) => (
      '<w:tr>' +
      tableCell([p(k, { bold: true, size: 18, color: '334155' })], 3120, 'F8FAFC') +
      tableCell([p(v, { size: 18, color: '0F172A' })], 6240) +
      '</w:tr>'
    )).join('') +
    '</w:tbl>'
  );
  bodyXml.push(p('', { spaceAfter: 200 }));

  // Findings Table
  bodyXml.push(p('2. DETERMINISTIC STATUTORY FINDINGS', { bold: true, size: 22, color: '0F172A', spaceAfter: 100 }));
  bodyXml.push(
    '<w:tbl>' +
    '<w:tblPr><w:tblW w:w="9360" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="6" w:space="0" w:color="0F172A"/><w:bottom w:val="single" w:sz="6" w:space="0" w:color="0F172A"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/></w:tblBorders></w:tblPr>' +
    '<w:tr>' +
    tableCell([p('Rule ID', { bold: true, size: 16, color: 'FFFFFF' })], 1600, '1E293B') +
    tableCell([p('Statutory Requirement', { bold: true, size: 16, color: 'FFFFFF' })], 2400, '1E293B') +
    tableCell([p('Status', { bold: true, size: 16, color: 'FFFFFF' })], 1400, '1E293B') +
    tableCell([p('Evaluation Reason & Evidence Details', { bold: true, size: 16, color: 'FFFFFF' })], 3960, '1E293B') +
    '</w:tr>' +
    report.canonicalResult.evaluations.map((ev) => {
      const rule = report.ruleMetadata.find((r) => r.id === ev.ruleId);
      const title = rule?.title ?? ev.ruleId;
      const statusColor = ev.result === 'PASS' ? '065F46' : ev.result === 'FAIL' ? '991B1B' : '92400E';
      const statusBg = ev.result === 'PASS' ? 'D1FAE5' : ev.result === 'FAIL' ? 'FEE2E2' : 'FEF3C7';
      const evidenceText = ev.evidence?.imageId ? `Evidence Image: ${ev.evidence.imageId}` : 'No image region localized';
      return (
        '<w:tr>' +
        tableCell([p(ev.ruleId, { bold: true, size: 16, color: '0F172A' })], 1600) +
        tableCell([p(title, { size: 16, color: '334155' })], 2400) +
        tableCell([p(ev.result, { bold: true, size: 16, color: statusColor })], 1400, statusBg) +
        tableCell([
          p(ev.reason, { size: 16, color: '0F172A', spaceAfter: 40 }),
          p(evidenceText, { size: 14, color: '64748B' }),
        ], 3960) +
        '</w:tr>'
      );
    }).join('') +
    '</w:tbl>'
  );
  bodyXml.push(p('', { spaceAfter: 200 }));

  // Barcode Scale Reference Section (if any)
  const barcodeEstimates = report.observations.filter(
    (obs) => isBarcodeScaleEstimateValue(obs.value)
  );
  if (barcodeEstimates.length > 0) {
    bodyXml.push(p('3. BARCODE SCALE-REFERENCE SCREENING ESTIMATES', { bold: true, size: 22, color: '0F172A', spaceAfter: 100 }));
    for (const est of barcodeEstimates) {
      if (isBarcodeScaleEstimateValue(est.value)) {
        bodyXml.push(p(`Observation ID: ${est.id} | Barcode Format: ${est.value.barcodeFormat}`, { bold: true, size: 18, color: '1E3A8A' }));
        bodyXml.push(p(`Estimated Scale: ${formatBarcodeScaleEstimate(est.value)}`, { size: 16, color: '334155', spaceAfter: 40 }));
        bodyXml.push(p('Assumptions:', { bold: true, size: 16, color: '475569' }));
        for (const asm of est.value.assumptions) {
          bodyXml.push(p(`• ${asm}`, { size: 14, color: '64748B' }));
        }
        bodyXml.push(p('Limitations:', { bold: true, size: 16, color: '475569' }));
        for (const lim of est.value.limitations) {
          bodyXml.push(p(`• ${lim}`, { size: 14, color: '64748B' }));
        }
        bodyXml.push(p('', { spaceAfter: 120 }));
      }
    }
  }

  // Footer / Audit Trail
  bodyXml.push(p('AUDIT TRAIL & CANONICAL VERIFICATION', { bold: true, size: 18, color: '475569', spaceAfter: 40 }));
  bodyXml.push(p(`Report generated by Maanak Digital Compliance Screening Engine. Deterministic verification: ${report.canonicalResult.evaluations.length} rules executed against ${report.observations.length} observed facts. All findings traceable to source evidence images.`, { size: 14, color: '64748B' }));

  // Document XML
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyXml.join('\n    ')}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const zipEntries: ZipEntry[] = [
    { path: '[Content_Types].xml', data: encoder.encode(contentTypesXml) },
    { path: '_rels/.rels', data: encoder.encode(relsXml) },
    { path: 'word/document.xml', data: encoder.encode(documentXml) },
  ];

  return buildZip(zipEntries);
}
