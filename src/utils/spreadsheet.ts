/**
 * Utility functions for parsing CSV / TSV spreadsheet data
 * and exporting formatted CSV files for election data and diary records.
 */

export interface ParsedSpreadsheet {
  headers: string[];
  rows: Record<string, string>[];
  rawMatrix: string[][];
}

/**
 * Parse raw pasted or uploaded spreadsheet text (CSV / TSV / Excel paste)
 */
export function parseSpreadsheetText(rawText: string): ParsedSpreadsheet {
  if (!rawText || !rawText.trim()) {
    return { headers: [], rows: [], rawMatrix: [] };
  }

  const lines = rawText.trim().split(/\r?\n/);
  if (lines.length === 0) {
    return { headers: [], rows: [], rawMatrix: [] };
  }

  // Detect delimiter: tab (\t), comma (,), or semicolon (;)
  const sampleLine = lines[0];
  let delimiter = '\t';
  if (sampleLine.includes('\t')) {
    delimiter = '\t';
  } else if (sampleLine.includes(',')) {
    delimiter = ',';
  } else if (sampleLine.includes(';')) {
    delimiter = ';';
  }

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const rawMatrix = lines.map(line => parseLine(line)).filter(row => row.some(cell => cell.length > 0));

  if (rawMatrix.length === 0) {
    return { headers: [], rows: [], rawMatrix: [] };
  }

  // First non-empty line as headers
  const headers = rawMatrix[0].map(h => h.replace(/^["']|["']$/g, '').trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < rawMatrix.length; i++) {
    const rowCells = rawMatrix[i];
    const rowObj: Record<string, string> = {};
    let hasData = false;

    headers.forEach((h, idx) => {
      const val = rowCells[idx] ? rowCells[idx].replace(/^["']|["']$/g, '').trim() : '';
      rowObj[h] = val;
      if (val) hasData = true;
    });

    if (hasData) {
      rows.push(rowObj);
    }
  }

  return { headers, rows, rawMatrix };
}

/**
 * Trigger browser download of CSV data
 */
export function downloadCSV(filename: string, headers: string[], rows: (Record<string, any> | any[])[]) {
  const escapeCell = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    if (str.includes(',') || str.includes('\n') || str.includes('"') || str.includes(';')) {
      return `"${str}"`;
    }
    return str;
  };

  let csvContent = headers.map(escapeCell).join(',') + '\n';

  rows.forEach(row => {
    if (Array.isArray(row)) {
      csvContent += row.map(escapeCell).join(',') + '\n';
    } else {
      const line = headers.map(h => escapeCell(row[h] ?? ''));
      csvContent += line.join(',') + '\n';
    }
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download sample CSV template for Diary of Election
 */
export function downloadDiaryCSVTemplate() {
  const headers = [
    'Title', 'Date', 'Subtitle', 'Status', 'Category', 'Country', 'Location', 
    'Electoral Body', 'Registered Voters', 'Polling Units', 'LGAs', 
    'Description', 'Key Issues', 'Executive Name', 'Executive Party'
  ];

  const sampleRows = [
    {
      'Title': 'Osun State Governorship Election 2026',
      'Date': '15 Aug 2026',
      'Subtitle': '30 LGAs + Area Office',
      'Status': 'Scheduled',
      'Category': 'national',
      'Country': 'Nigeria',
      'Location': 'Osun State',
      'Electoral Body': 'INEC',
      'Registered Voters': '2,339,233',
      'Polling Units': '3,763',
      'LGAs': '30',
      'Description': 'Off-cycle governorship election monitored by Athena observers.',
      'Key Issues': 'BVAS machine deployment; IReV real-time upload; Security neutrality',
      'Executive Name': 'Ademola Adeleke',
      'Executive Party': 'PDP'
    },
    {
      'Title': 'Anambra State Governorship Polls',
      'Date': '08 Nov 2025',
      'Subtitle': '21 LGAs Contested',
      'Status': 'Concluded',
      'Category': 'national',
      'Country': 'Nigeria',
      'Location': 'Anambra State',
      'Electoral Body': 'INEC',
      'Registered Voters': '2,525,471',
      'Polling Units': '5,720',
      'LGAs': '21',
      'Description': 'Gubernatorial election with high security presence and BVAS audit.',
      'Key Issues': 'Voter turnout; Security deployment; Logistics timeliness',
      'Executive Name': 'Charles Soludo',
      'Executive Party': 'APGA'
    }
  ];

  downloadCSV('athena_diary_of_election_template.csv', headers, sampleRows);
}

/**
 * Download sample CSV template for Election Results Data
 */
export function downloadElectionDataCSVTemplate() {
  const headers = [
    'State Code', 'State Name', 'Election Title', 'Status', 'Date', 
    'Registered Voters', 'Accredited Voters', 'Polling Units', 'LGAs', 'Wards', 
    'Valid Votes', 'Rejected Votes', 'Total Votes', 'Reconciliation Rate', 
    'APC Votes', 'PDP Votes', 'LP Votes', 'NNPP Votes', 'APGA Votes', 'SDP Votes'
  ];

  const sampleRows = [
    {
      'State Code': 'OS',
      'State Name': 'Osun',
      'Election Title': 'Osun State Governorship Election 2026',
      'Status': 'Upcoming',
      'Date': '15 Aug 2026',
      'Registered Voters': '2,339,233',
      'Accredited Voters': '0',
      'Polling Units': '3,763',
      'LGAs': '30',
      'Wards': '332',
      'Valid Votes': '0',
      'Rejected Votes': '0',
      'Total Votes': '0',
      'Reconciliation Rate': 'Pending Audit',
      'APC Votes': '0',
      'PDP Votes': '0',
      'LP Votes': '0',
      'NNPP Votes': '0',
      'APGA Votes': '0',
      'SDP Votes': '0'
    },
    {
      'State Code': 'ON',
      'State Name': 'Ondo',
      'Election Title': 'Ondo Gubernatorial Poll 2024',
      'Status': 'Concluded',
      'Date': '16 Nov 2024',
      'Registered Voters': '2,053,061',
      'Accredited Voters': '508,962',
      'Polling Units': '3,933',
      'LGAs': '18',
      'Wards': '203',
      'Valid Votes': '489,120',
      'Rejected Votes': '12,342',
      'Total Votes': '501,462',
      'Reconciliation Rate': '99.4%',
      'APC Votes': '366612',
      'PDP Votes': '117845',
      'LP Votes': '4743',
      'NNPP Votes': '1200',
      'APGA Votes': '1500',
      'SDP Votes': '3210'
    }
  ];

  downloadCSV('athena_election_data_results_template.csv', headers, sampleRows);
}
