import re

with open('src/components/LiveDashboard.tsx', 'r') as f:
    content = f.read()

new_closest = """  const closestElections = useMemo(() => {
    const now = new Date();
    now.setHours(0,0,0,0);

    const upcoming = allDiaryItems.filter(item => {
      const t = parseDateValue(item.date);
      if (t === 0) return false;
      return t >= now.getTime();
    });

    // Sort from nearest upcoming to furthest upcoming
    upcoming.sort((a, b) => {
      const tA = parseDateValue(a.date);
      const tB = parseDateValue(b.date);
      return tA - tB;
    });

    return upcoming.slice(0, 3);
  }, [allDiaryItems]);"""

content = re.sub(r"  const closestElections = useMemo\(\(\) => \{[\s\S]*?    \}\);\n\n    return \[.*?\]\.slice\(0, 3\);\n  \}, \[allDiaryItems\]\);", new_closest, content)

with open('src/components/LiveDashboard.tsx', 'w') as f:
    f.write(content)

print("Done")
