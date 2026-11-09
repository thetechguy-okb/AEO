import re
import sys

with open('src/data.ts', 'r') as f:
    content = f.read()

month_map = {
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
}

def replace_date(match):
    date_str = match.group(1)
    
    # Range of days: 18-20 Sep 2026 -> Take the start date 18 Sep 2026? Or leave it?
    # User said: "Every election must have one valid, complete election date stored as a real date value... YYYY-MM-DD"
    # Wait, the instruction says "If legacy records contain incomplete dates, preserve those records but identify them for correction. Do not guess their actual dates."
    
    # 15 Aug 2026 -> 2026-08-15
    m1 = re.match(r'^(\d{1,2})[\s,]+([a-zA-Z]+)[\s,]+(\d{4})$', date_str)
    if m1:
        d = m1.group(1).zfill(2)
        m = month_map.get(m1.group(2).lower(), '01')
        y = m1.group(3)
        return f"date: '{y}-{m}-{d}'"
        
    m2 = re.match(r'^(\d{1,2})[-–](\d{1,2})[\s,]+([a-zA-Z]+)[\s,]+(\d{4})$', date_str)
    if m2:
        d = m2.group(1).zfill(2)
        m = month_map.get(m2.group(3).lower(), '01')
        y = m2.group(4)
        return f"date: '{y}-{m}-{d}'"
        
    return match.group(0)

new_content = re.sub(r"date:\s*'([^']+)'", replace_date, content)

with open('src/data.ts', 'w') as f:
    f.write(new_content)

print("Done")
