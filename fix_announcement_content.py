import re

with open('src/components/AnnouncementReader.tsx', 'r') as f:
    content = f.read()

content = content.replace("content={announcement.content || announcement.summary}", "content={(announcement as any).content || (announcement as any).body || (announcement as any).richText || (announcement as any).html || announcement.summary}")

with open('src/components/AnnouncementReader.tsx', 'w') as f:
    f.write(content)

print("Done")
