import re

with open('src/components/Diary.tsx', 'r') as f:
    content = f.read()

content = content.replace("statusFilter", "timingFilter, yearFilter")

with open('src/components/Diary.tsx', 'w') as f:
    f.write(content)

print("Done")
