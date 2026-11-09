import re

with open('src/components/ReportReader.tsx', 'r') as f:
    content = f.read()

old_content = """        {/* Dynamic Section Contents */}
        <div className="space-y-8 text-ink text-sm sm:text-base leading-relaxed">
          {(report.sections || []).map((section, idx) => (
            <section key={idx} className="space-y-3">
              <h2 className="font-display font-bold text-xl sm:text-2xl text-ink flex items-center gap-2">
                {section.title}
              </h2>
              <FormattedText content={section.content} className="text-ink2 pl-0 sm:pl-5" />
            </section>
          ))}
        </div>"""

new_content = """        {/* Dynamic Section Contents */}
        <div className="space-y-8 text-ink text-sm sm:text-base leading-relaxed">
          {(report.sections && report.sections.length > 0) ? (
            report.sections.map((section, idx) => (
              <section key={idx} className="space-y-3">
                <h2 className="font-display font-bold text-xl sm:text-2xl text-ink flex items-center gap-2">
                  {section.title}
                </h2>
                <FormattedText content={section.content} className="text-ink2 pl-0 sm:pl-5" />
              </section>
            ))
          ) : (
            <FormattedText content={(report as any).content || (report as any).body || (report as any).richText || (report as any).html} className="text-ink2" />
          )}
        </div>"""

content = content.replace(old_content, new_content)

with open('src/components/ReportReader.tsx', 'w') as f:
    f.write(content)

print("Done")
