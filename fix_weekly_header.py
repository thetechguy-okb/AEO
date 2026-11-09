import re

with open('src/components/WeeklyReader.tsx', 'r') as f:
    content = f.read()

old_header = """                <h2 className="font-display font-bold text-lg sm:text-xl text-ink">
                  {sec.title}
                </h2>
                <FormattedText content={sec.text} />"""

new_header = """                {sec.title && (
                  <h2 className="font-display font-bold text-lg sm:text-xl text-ink">
                    {sec.title}
                  </h2>
                )}
                <FormattedText content={sec.text} />"""

content = content.replace(old_header, new_header)

with open('src/components/WeeklyReader.tsx', 'w') as f:
    f.write(content)

print("Done")
