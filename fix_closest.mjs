import fs from 'fs';

let content = fs.readFileSync('src/components/LiveDashboard.tsx', 'utf8');

const replacement = `  const closestElections = useMemo(() => {
    const now = new Date();
    now.setHours(0,0,0,0);

    const upcoming = allDiaryItems.filter(item => {
      const t = parseDateValue(item.date);
      if (t === 0) return false;
      
      // Exclude Osun if needed, although user said "Do not hard-code specific elections."
      // The instruction: "For example: The FCT election must not continue appearing as an upcoming election after its scheduled election date has passed. Also audit every other election..."
      // The user wants strict logic. So no Osun hardcode.
      return t >= now.getTime();
    });

    // Sort from nearest upcoming to furthest upcoming
    upcoming.sort((a, b) => {
      const tA = parseDateValue(a.date);
      const tB = parseDateValue(b.date);
      return tA - tB;
    });

    return upcoming.slice(0, 3);
  }, [allDiaryItems]);`;

content = content.replace(/const closestElections = useMemo\(\(\) => \{[\s\S]*?\}, \[allDiaryItems\]\);/, replacement);

fs.writeFileSync('src/components/LiveDashboard.tsx', content);
console.log("Done");
