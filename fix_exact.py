import os

data_files = ["anambra.js", "ondo.js", "bayelsa.js", "kogi.js", "imo.js"]

for filename in data_files:
    filepath = os.path.join("src/data", filename)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Replace `"b64chunks"` with `b64chunks`
    new_content = content.replace('"rowsGzipBase64":"b64chunks"', '"rowsGzipBase64": b64chunks')
    new_content = new_content.replace('"rowsGzipBase64": "b64chunks"', '"rowsGzipBase64": b64chunks')
    new_content = new_content.replace('"rowsGzipBase64":b64chunks', '"rowsGzipBase64": b64chunks')
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_content)
    
    has_ref = '"rowsGzipBase64": b64chunks' in new_content
    print(f"Updated {filename}: contains variable ref? {has_ref}")
