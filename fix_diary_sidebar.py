import re

with open('src/components/Diary.tsx', 'r') as f:
    content = f.read()

# Generate dynamic years logic to put at the top of the component
years_logic = """  const availableYears = useMemo(() => {
    const years = new Set<number>();
    allDiaryItems.forEach(item => {
      if ((item as any)._year) years.add((item as any)._year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [allDiaryItems]);
"""

# Inject before `const getStatusColor`
content = content.replace("  const getStatusColor =", years_logic + "\n  const getStatusColor =")

# Add the UI dropdowns
dropdowns_ui = """              {/* Status and Year Filters */}
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={timingFilter}
                  onChange={(e) => setTimingFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-paper border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-brand-blue"
                >
                  <option value="all">All Timing</option>
                  <option value="upcoming">Upcoming Elections</option>
                  <option value="past">Past Elections</option>
                </select>

                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-paper border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-brand-blue"
                >
                  <option value="all">All Years</option>
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>"""

content = content.replace("              {/* Exact Tree List as drawn in Sketch */}", dropdowns_ui + "\n\n              {/* Exact Tree List as drawn in Sketch */}")

with open('src/components/Diary.tsx', 'w') as f:
    f.write(content)
print("Done")
