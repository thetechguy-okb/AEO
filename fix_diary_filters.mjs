import fs from 'fs';

let content = fs.readFileSync('src/components/Diary.tsx', 'utf8');

// Replace statusFilter with timingFilter and yearFilter
content = content.replace(/const \[statusFilter, setStatusFilter\] = useState<string>\('all'\);/, `const [timingFilter, setTimingFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');`);

// Update the useMemo for allDiaryItems to include numeric dates and years
content = content.replace(/return \[\.\.\.nat, \.\.\.loc, \.\.\.afr, \.\.\.oth\];/g, `const combined = [...nat, ...loc, ...afr, ...oth];
    return combined.map(item => {
      const timestamp = window.parseDateValue ? window.parseDateValue(item.date) : 0;
      let numericYear = null;
      let t = 0;
      if (typeof item.date === 'string' && /^\\d{4}-\\d{2}-\\d{2}$/.test(item.date)) {
        t = new Date(item.date).getTime();
        numericYear = new Date(item.date).getFullYear();
      } else {
        const dStr = String(item.date).trim();
        const yMatch = dStr.match(/\\d{4}/);
        if (yMatch) numericYear = parseInt(yMatch[0], 10);
      }
      return { ...item, _timestamp: t, _year: numericYear };
    });`);

