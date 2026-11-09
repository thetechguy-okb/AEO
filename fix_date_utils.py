import re

with open('src/utils/date.ts', 'r') as f:
    content = f.read()

# Replace formatReportDate
new_format_report_date = """export function formatReportDate(dateStr: any): string {
  if (!dateStr) return '';
  
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
  }

  const d = new Date(parseDateValue(dateStr));
  if (d && !isNaN(d.getTime()) && d.getTime() > 0) {
     // Check if original string was incomplete (like Q3, or Aug 2026)
     const origStr = String(dateStr).trim().toLowerCase();
     if (/^q[1-4]|mid|late|early|-|\//.test(origStr) || /^[a-z]+\s+\d{4}$/.test(origStr) || /^\d{4}$/.test(origStr)) {
       return "Date Pending (Update Required)"; // Identify for correction as per instructions
     }
     
     const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
     return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  return "Date Pending (Update Required)";
}
"""

content = re.sub(r'export function formatReportDate.*?^}\n', new_format_report_date, content, flags=re.MULTILINE|re.DOTALL)

with open('src/utils/date.ts', 'w') as f:
    f.write(content)
print("Done")
