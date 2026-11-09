import re

with open('src/components/WeeklyReader.tsx', 'r') as f:
    content = f.read()

# Replace getFullContent
old_getFullContent = """  const getFullContent = (id: string) => {
    // If sections and author are already defined on the issue itself (via CMS), use those!
    if (issue.author && issue.readingTime && issue.sections) {
      return {
        author: issue.author,
        readingTime: issue.readingTime,
        sections: issue.sections
      };
    }"""

new_getFullContent = """  const getFullContent = (id: string) => {
    // If sections are defined on the issue itself (via CMS or data), use those
    // We shouldn't strictly require author or readingTime to show sections.
    if (issue.sections && issue.sections.length > 0) {
      return {
        author: issue.author || issue.authorsList || "Athena Research",
        readingTime: issue.readingTime || "5 min read",
        sections: issue.sections
      };
    }
    
    // Also check for 'content' or 'body' field if it was saved differently
    if ((issue as any).content || (issue as any).body || (issue as any).richText || (issue as any).html) {
      return {
        author: issue.author || issue.authorsList || "Athena Research",
        readingTime: issue.readingTime || "5 min read",
        sections: [
          {
            title: "",
            text: (issue as any).content || (issue as any).body || (issue as any).richText || (issue as any).html
          }
        ]
      };
    }"""

content = content.replace(old_getFullContent, new_getFullContent)

with open('src/components/WeeklyReader.tsx', 'w') as f:
    f.write(content)

print("Done")
