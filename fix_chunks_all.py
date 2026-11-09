import os
import re

data_dir = "src/data"

for filename in os.listdir(data_dir):
    if filename.endswith(".js"):
        filepath = os.path.join(data_dir, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Find any string inside const b64chunks = [ ... ]
        m = re.search(r'const b64chunks = \[\s*("(?:[^"\\]|\\.)*")\s*\]\.join\(""\);', content, re.DOTALL)
        if not m:
            # Let's try matching everything between [ and ].join("")
            m = re.search(r'const b64chunks = \[(.*?)\]\.join\(""\);', content, re.DOTALL)
        
        if m:
            inner = m.group(1)
            # Extract all double quoted string contents
            strings = re.findall(r'"((?:[^"\\]|\\.)*)"', inner, re.DOTALL)
            full_str = "".join(s.replace("\n", "").replace("\r", "") for s in strings)
            
            chunk_size = 500
            chunks = [full_str[i:i+chunk_size] for i in range(0, len(full_str), chunk_size)]
            formatted = 'const b64chunks = [\n  ' + ',\n  '.join(f'"{c}"' for c in chunks) + '\n].join("");'
            
            new_content = content[:m.start()] + formatted + content[m.end():]
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Processed {filename}: Total string length {len(full_str)}, created {len(chunks)} chunks.")
        else:
            print(f"No match for b64chunks in {filename}")
