import fs from 'fs';

let content = fs.readFileSync('src/components/Diary.tsx', 'utf8');

// 1. Import parseDateValue
if (!content.includes('parseDateValue')) {
    content = content.replace(/import { sortItemsByDate } from '\.\.\/utils\/date';/, "import { sortItemsByDate, parseDateValue } from '../utils/date';");
}

// 2. Change filters
content = content.replace(/const \[statusFilter, setStatusFilter\] = useState<string>\('all'\);/, `const [timingFilter, setTimingFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');`);

// 3. Process all items to have valid parsed dates and years
content = content.replace(/return \[\.\.\.nat, \.\.\.loc, \.\.\.afr, \.\.\.oth\];/g, `const combined = [...nat, ...loc, ...afr, ...oth];
    return combined.map(item => {
      const timestamp = parseDateValue(item.date);
      let y = null;
      if (timestamp > 0) {
        y = new Date(timestamp).getFullYear();
      } else {
        const dStr = String(item.date || '').trim();
        const yMatch = dStr.match(/\\d{4}/);
        if (yMatch) {
          y = parseInt(yMatch[0], 10);
        }
      }
      return { ...item, _timestamp: timestamp, _year: y };
    });`);

// 4. Update filtering logic
const oldFilterBlock = `      // 3. Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }`;
const newFilterBlock = `      // 3. Timing Filter (Upcoming / Past)
      const now = new Date();
      now.setHours(0,0,0,0);
      const isPast = (item as any)._timestamp > 0 && (item as any)._timestamp < now.getTime();
      
      if (timingFilter === 'upcoming') {
        // Upcoming: date >= today and current calendar year
        const currentYear = new Date().getFullYear();
        if (isPast) return false;
        if ((item as any)._year !== currentYear && (item as any)._timestamp > 0) return false; 
        // wait, the user said: "Upcoming Elections must show ONLY elections that: have a date today or in future AND are taking place within the CURRENT CALENDAR YEAR."
        // "Past Elections must include ALL elections whose election date has passed. This includes earlier in current year, previous year, and every earlier year."
      } else if (timingFilter === 'past') {
        if (!isPast && (item as any)._timestamp > 0) return false;
      }

      // 3b. Year Filter
      if (yearFilter !== 'all') {
        if (String((item as any)._year) !== yearFilter) {
          return false;
        }
      }`;

content = content.replace(oldFilterBlock, newFilterBlock);

// 5. Active filters count reset update
content = content.replace(/setRegionFilter\('all'\);\n    setTypeFilter\('all'\);\n    setStatusFilter\('all'\);/g, `setRegionFilter('all');
    setTypeFilter('all');
    setTimingFilter('all');
    setYearFilter('all');`);

content = content.replace(/\(statusFilter !== 'all' \? 1 : 0\)/g, `(timingFilter !== 'all' ? 1 : 0) + (yearFilter !== 'all' ? 1 : 0)`);

// 6. We need to find where the sidebar dropdowns should be added for these new filters!
// Wait, I will use React components to replace the status filter if it was there, but the user says it wasn't there before.
// I will just add the dropdowns under the Search Bar.

fs.writeFileSync('src/components/Diary.tsx', content);
console.log("Done");
