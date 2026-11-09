import re

with open('src/components/LiveDashboard.tsx', 'r') as f:
    content = f.read()

# Add import
content = content.replace("import { parseDateValue } from '../utils/date';", "import { parseDateValue, formatReportDate } from '../utils/date';")

# Fix {item.date} rendering in closestElections
content = content.replace("{item.date}", "{formatReportDate(item.date)}")

with open('src/components/LiveDashboard.tsx', 'w') as f:
    f.write(content)

with open('src/components/Diary.tsx', 'r') as f:
    content2 = f.read()

# Make sure formatReportDate is imported in Diary.tsx
if 'formatReportDate' not in content2:
    content2 = content2.replace("import { sortItemsByDate, parseDateValue } from '../utils/date';", "import { sortItemsByDate, parseDateValue, formatReportDate } from '../utils/date';")

# Fix {item.date} in Diary.tsx list
content2 = content2.replace("{item.date}", "{formatReportDate(item.date)}")

with open('src/components/Diary.tsx', 'w') as f:
    f.write(content2)

print("Done")
