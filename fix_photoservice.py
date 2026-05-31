
import re

filepath = 'E:/Demo_Ecommerce/billbook-backend/src/main/java/com/billbook/service/PhotoInvoiceService.java'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    # Fix the broken split line (line 186 area)
    if 'text.split(' in line and '");' not in line.rstrip().endswith('");'):
        # This line is broken - check next line
        if i + 1 < len(lines) and '");' in lines[i + 1]:
            # Merge and fix
            new_lines.append('            String[] lines = text.split("\\n");
')
            i += 2  # skip the broken next line
            continue
    # Fix the matches line with \s
    if 'name.matches(' in line and '\s' in line and '\\s' not in line:
        line = line.replace('\s', '\\s')
    new_lines.append(line)
    i += 1

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('PhotoInvoiceService.java fixed!')
