import type { Shift } from '../types'

const HEADERS = [
  'Date',
  'Clock In',
  'Clock Out',
  'Break (min)',
  'Hours Worked',
  'Hourly Rate',
  'Gross Pay',
  'Notes',
]

function shiftRows(shifts: Shift[]): (string | number)[][] {
  return [...shifts]
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .map((s) => [
      s.date,
      s.startTime,
      s.endTime,
      s.breakMinutes,
      Number(s.hoursWorked.toFixed(2)),
      Number(s.hourlyRate.toFixed(2)),
      Number(s.grossPay.toFixed(2)),
      s.notes,
    ])
}

function download(filename: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function stamp(): string {
  return new Date().toISOString().slice(0, 10)
}

export function exportShiftsCSV(shifts: Shift[]) {
  const escape = (v: string | number) => {
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [HEADERS, ...shiftRows(shifts)].map((row) => row.map(escape).join(','))
  download(`hawks-ridge-shifts-${stamp()}.csv`, 'text/csv;charset=utf-8', lines.join('\n'))
}

// SpreadsheetML 2003 — opens natively in Excel with typed cells.
export function exportShiftsExcel(shifts: Shift[]) {
  const xmlEscape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const cell = (v: string | number) =>
    typeof v === 'number'
      ? `<Cell><Data ss:Type="Number">${v}</Data></Cell>`
      : `<Cell><Data ss:Type="String">${xmlEscape(v)}</Data></Cell>`
  const row = (cells: (string | number)[]) => `<Row>${cells.map(cell).join('')}</Row>`
  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Shifts">
  <Table>
${[HEADERS, ...shiftRows(shifts)].map(row).join('\n')}
  </Table>
 </Worksheet>
</Workbook>`
  download(`hawks-ridge-shifts-${stamp()}.xls`, 'application/vnd.ms-excel', xml)
}
