import json, re
with open('/root/.config/opencode/opencode.jsonc') as f:
    content = f.read()
# Remove only line comments that are NOT inside strings
in_string = False
escaped = False
result = []
i = 0
while i < len(content):
    c = content[i]
    if escaped:
        result.append(c)
        escaped = False
        i += 1
        continue
    if c == '\\\\':
        result.append(c)
        escaped = True
        i += 1
        continue
    if c == '\"':
        in_string = not in_string
        result.append(c)
        i += 1
        continue
    if not in_string and c == '/' and i+1 < len(content) and content[i+1] == '/':
        # line comment — skip to end of line
        while i < len(content) and content[i] != '\n':
            i += 1
        continue
    if not in_string and c == '/' and i+1 < len(content) and content[i+1] == '*':
        # block comment — skip to */
        i += 2
        while i+1 < len(content) and not (content[i] == '*' and content[i+1] == '/'):
            i += 1
        i += 2
        continue
    result.append(c)
    i += 1

cleaned = ''.join(result)
data = json.loads(cleaned)
agents = data.get('agent', {})
for name in sorted(agents):
    plen = len(agents[name]['prompt'])
    print(f'{name:12s}: prompt = {plen:5d} chars')
print(f'Total agents: {len(agents)}')
print('JSON valid!')
