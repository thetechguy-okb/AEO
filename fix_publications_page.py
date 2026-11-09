import re

with open('src/components/PublicationsPage.tsx', 'r') as f:
    content = f.read()

# Replace pdfUrl: xxx with pdfUrl: xxx, reads: xxx, downloads: xxx
content = re.sub(r'pdfUrl:\s*r\.pdfUrl\s*', r'pdfUrl: r.pdfUrl,\n      reads: r.reads,\n      downloads: r.downloads\n', content)
content = re.sub(r'pdfUrl:\s*w\.pdfUrl\s*', r'pdfUrl: w.pdfUrl,\n      reads: w.reads,\n      downloads: w.downloads\n', content)
content = re.sub(r'pdfUrl:\s*a\.pdfUrl\s*', r'pdfUrl: a.pdfUrl,\n      reads: a.reads,\n      downloads: a.downloads\n', content)

with open('src/components/PublicationsPage.tsx', 'w') as f:
    f.write(content)
print("Done")
