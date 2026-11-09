import re

with open('src/components/CMSPanel.tsx', 'r') as f:
    content = f.read()

old_date_field = """                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Electoral Date String *</label>
                          <input 
                            type="text" 
                            value={diaryForm.date || ''} 
                            onChange={(e) => setDiaryForm({ ...diaryForm, date: e.target.value })}
                            placeholder="E.g., Aug 15, 2026 or 15 August 2026"
                            className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono"
                            required
                          />"""

new_date_field = """                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Election Date (YYYY-MM-DD) *</label>
                          <input 
                            type="date" 
                            value={diaryForm.date || ''} 
                            onChange={(e) => setDiaryForm({ ...diaryForm, date: e.target.value })}
                            placeholder="YYYY-MM-DD"
                            className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono"
                            required
                          />"""

content = content.replace(old_date_field, new_date_field)

with open('src/components/CMSPanel.tsx', 'w') as f:
    f.write(content)

print("Done")
