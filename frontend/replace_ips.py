import os
import glob
import re

base_dir = "/home/phantomvisible/Documents/GitHub/PlantSocial/frontend/src"

files = []
for ext in ('**/*.ts', ):
    files.extend(glob.glob(os.path.join(base_dir, ext), recursive=True))

replacements = [
    (r"'http://192\.168\.1\.250:8080/api/v1/?'", "environment.apiUrl"),
    (r"`http://192\.168\.1\.250:8080/api/v1(.*?)`", r"`${environment.apiUrl}\1`"),
    (r"'http://192\.168\.1\.250:8080/api/v1(.*?)'", r"environment.apiUrl + '\1'"),
    (r"http://192\.168\.1\.250:8080/api/v1", r"${environment.apiUrl}"),

    (r"'http://192\.168\.1\.250:8081/api/game/?'", "environment.gamificationApiUrl"),
    (r"`http://192\.168\.1\.250:8081/api/game(.*?)`", r"`${environment.gamificationApiUrl}\1`"),
    (r"'http://192\.168\.1\.250:8081/api/game(.*?)'", r"environment.gamificationApiUrl + '\1'"),
    (r"http://192\.168\.1\.250:8081/api/game", r"${environment.gamificationApiUrl}"),

    (r"'http://192\.168\.1\.250:8080/?'", "environment.baseUrl"),
    (r"`http://192\.168\.1\.250:8080(.*?)`", r"`${environment.baseUrl}\1`"),
    (r"'http://192\.168\.1\.250:8080(.*?)'", r"environment.baseUrl + '\1'"),
    (r"http://192\.168\.1\.250:8080", r"${environment.baseUrl}"),

    (r"'http://192\.168\.1\.250:8081/?'", "environment.gamificationBaseUrl"),
    (r"`http://192\.168\.1\.250:8081(.*?)`", r"`${environment.gamificationBaseUrl}\1`"),
    (r"'http://192\.168\.1\.250:8081(.*?)'", r"environment.gamificationBaseUrl + '\1'"),
    (r"http://192\.168\.1\.250:8081", r"${environment.gamificationBaseUrl}"),

    (r"'ws://192\.168\.1\.250:8080/ws'", "environment.wsUrl"),
    (r"`ws://192\.168\.1\.250:8080/ws`", r"`${environment.wsUrl}`"),
    (r"ws://192\.168\.1\.250:8080/ws", r"${environment.wsUrl}"),
]

for file_path in files:
    if "environment.ts" in file_path or "environment.development.ts" in file_path:
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    for pattern, repl in replacements:
        content = re.sub(pattern, repl, content)
        
    # auth.interceptor special case
    if "auth.interceptor.ts" in file_path:
        content = content.replace("req.url.startsWith(environment.baseUrl)", "req.url.startsWith(environment.baseUrl)")

    if content != original_content and file_path.endswith(".ts"):
        # We need to compute relative path to environment.ts
        rel_path = os.path.relpath(file_path, base_dir)
        parts = rel_path.split(os.sep)
        depth = len(parts) - 1
        
        env_import_path = "../" * depth + "environments/environment"
        
        if "environment" not in content[:500]: # simplistic check
            # insert import after last import
            lines = content.split('\n')
            last_import_idx = -1
            for i, line in enumerate(lines):
                if line.startswith("import "):
                    last_import_idx = i
            
            import_stmt = f"import {{ environment }} from '{env_import_path}';"
            if last_import_idx != -1:
                lines.insert(last_import_idx + 1, import_stmt)
            else:
                lines.insert(0, import_stmt)
            
            content = '\n'.join(lines)
            
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file_path}")
