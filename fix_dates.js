const fs = require('fs');
let content = fs.readFileSync('src/data.ts', 'utf8');

const monthMap = {
    'jan': '01', 'january': '01',
    'feb': '02', 'february': '02',
    'mar': '03', 'march': '03',
    'apr': '04', 'april': '04',
    'may': '05',
    'jun': '06', 'june': '06',
    'jul': '07', 'july': '07',
    'aug': '08', 'august': '08',
    'sep': '09', 'september': '09',
    'oct': '10', 'october': '10',
    'nov': '11', 'november': '11',
    'dec': '12', 'december': '12'
};

content = content.replace(/date:\s*'([^']+)'/g, (match, dateStr) => {
    let newDate = dateStr;
    // 15 Aug 2026 -> 2026-08-15
    const matchDmy = dateStr.match(/^(\d{1,2})[\s,]+([a-zA-Z]+)[\s,]+(\d{4})$/);
    if (matchDmy) {
        let d = matchDmy[1].padStart(2, '0');
        let m = monthMap[matchDmy[2].toLowerCase()] || '01';
        let y = matchDmy[3];
        return `date: '${y}-${m}-${d}'`;
    }
    // Aug 2026 -> 2026-08-01 (Wait, is this correct? The user said "do not guess their actual dates" "If legacy records contain incomplete dates, preserve those records but identify them for correction.")
    // Actually, "Do not guess their actual dates. If legacy records contain incomplete dates, preserve those records but identify them for correction."
    // Let me just replace the ones I can parse exactly and maybe keep the others for now, but wait, the instruction says:
    // "On the public website, display election dates in full as: 16 August 2026"
    // "Remove quarter-based or month/year-only public date displays where an actual complete election date exists."
    return match;
});

console.log("Done");
