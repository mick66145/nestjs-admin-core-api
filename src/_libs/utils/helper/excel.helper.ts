import range from 'lodash/range';
import * as XLSX from 'xlsx';
import { BorderStyle, Worksheet, Workbook, Style, Cell, Row } from 'exceljs';
import iconv from 'iconv-lite';
import { Duplex } from 'stream';
import { toArrayBuffer } from './parse-value';

export async function parseCsv(buf: Buffer) {
  // 1. 用 iconv 解成 utf8，並去除 BOM
  let decoded = iconv.decode(buf, 'utf8');
  if (decoded.charCodeAt(0) === 0xfeff) {
    decoded = decoded.slice(1);
  }

  // 2. 包成可讀字串串流
  const stringToStream = (str: string): Duplex => {
    const s = new Duplex();
    s.push(str);
    s.push(null);
    return s;
  };

  const stream = stringToStream(decoded);

  // 3. ExcelJS 解析
  const workbook = new Workbook();
  await workbook.csv.read(stream);
  return workbook;
}

// xls 轉成 xlsx
export function convertToXlsx(buffer: Buffer): Buffer {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  return XLSX.writeXLSX(workbook, { type: 'buffer' });
}

export async function toWorkbook(
  buffer: Buffer,
  mime: 'xlsx' | 'xls' | 'csv' = 'xlsx',
): Promise<Workbook> {
  if (mime === 'xlsx' || mime === 'xls') {
    const workbook = new Workbook();
    await workbook.xlsx.load(toArrayBuffer(convertToXlsx(buffer)));
    return workbook;
  } else if (mime === 'csv') {
    return await parseCsv(buffer);
  } else {
    throw Error(`無效的檔案類別，${mime}`);
  }
}

export function getTextsOfRowCells(row: Row, start: number, length: number) {
  return range(start, start + length).map((i) => row.getCell(i).text);
}

export function createOuterBorder(
  worksheet: Worksheet,
  [startCol, startRow]: [number, number],
  [endCol, endRow]: [number, number],
  style: BorderStyle = 'medium',
) {
  for (let i = startRow; i <= endRow; i++) {
    const leftBorderCell = worksheet.getCell(i, startCol);
    const rightBorderCell = worksheet.getCell(i, endCol);

    leftBorderCell.border = {
      ...leftBorderCell.border,
      left: {
        style,
      },
    };

    rightBorderCell.border = {
      ...rightBorderCell.border,
      right: {
        style,
      },
    };
  }

  for (let i = startCol; i <= endCol; i++) {
    const topBorderCell = worksheet.getCell(startRow, i);
    const bottomBorderCell = worksheet.getCell(endRow, i);

    topBorderCell.border = {
      ...topBorderCell.border,
      top: {
        style,
      },
    };

    bottomBorderCell.border = {
      ...bottomBorderCell.border,
      bottom: {
        style,
      },
    };
  }
}

export function setRangeStyle(
  worksheet: Worksheet,
  [startCol, startRow]: [number, number],
  [endCol, endRow]: [number, number],
  style: Partial<Style>,
  options?: {
    type: 'merge' | 'replace';
  },
) {
  const { type = 'merge' } = options ?? {};

  for (let i = startRow; i <= endRow; i++) {
    for (let j = startCol; j <= endCol; j++) {
      if (type === 'merge') {
        const cellStyle = { ...worksheet.getCell(i, j).style };
        worksheet.getCell(i, j).style = Object.assign({}, style, cellStyle);
      } else {
        worksheet.getCell(i, j).style = style;
      }
    }
  }
}

export function cellMergeStyle(cell: Cell, style: Partial<Style>) {
  const cellStyle = { ...cell.style };
  cell.style = Object.assign({}, style, cellStyle);
}
