import fs from 'fs';

let content = fs.readFileSync('src/utils/date.ts', 'utf8');

const newFunc = `export function formatReportDate(dateStr: any): string {
  if (!dateStr) return '';
  
  const origStr = String(dateStr).trim().toLowerCase();
  
  if (typeof dateStr === 'string' && /^\\d{4}-\\d{2}-\\d{2}$/.test(dateStr)) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return \`\${d.getDate()} \${months[d.getMonth()]} \${d.getFullYear()}\`;
    }
  }

  const t = parseDateValue(dateStr);
  if (t > 0) {
     const d = new Date(t);
     // Check if original string was incomplete (like Q3, or Aug 2026, or year range)
     if (/^q[1-4]|mid|late|early|-|\\/|–/.test(origStr) || /^[a-z]+\\s+\\d{4}$/.test(origStr) || /^\\d{4}$/.test(origStr)) {
       return "Date Pending (CMS Update Required)"; // Identify for correction as per instructions
     }
     
     const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
     return \`\${d.getDate()} \${months[d.getMonth()]} \${d.getFullYear()}\`;
  }

  return "Date Pending (CMS Update Required)";
}
`;

content = content.replace(/export function formatReportDate[\s\S]*?^}\n/m, newFunc);

fs.writeFileSync('src/utils/date.ts', content);
console.log("Done");
