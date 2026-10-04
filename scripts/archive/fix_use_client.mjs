import fs from 'fs/promises';
import path from 'path';

async function processDirectory(dir) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory() && !fullPath.includes('node_modules') && !fullPath.includes('.next')) {
      await processDirectory(fullPath);
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      await processFile(fullPath);
    }
  }
}

async function processFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    let original = content;

    // 1. Ensure "use client" is at the very top
    if (content.includes('"use client"') || content.includes("'use client'")) {
      content = content.replace(/import Link from "next\/link";\n"use client";\n/, '"use client";\nimport Link from "next/link";\n');
      content = content.replace(/import Link from "next\/link";\n\n"use client";\n/, '"use client";\nimport Link from "next/link";\n');
      
      // If it still exists but not at top:
      content = content.replace(/^(import.*?\n)+"use client";\n/m, (match) => {
         return `"use client";\n` + match.replace('"use client";\n', '');
      });
      // Just a brute force: remove all use client and prepend
      if (content.includes('"use client"')) {
          content = content.replace(/"use client";?\n?/g, '');
          content = `"use client";\n` + content;
      }
    }

    // 2. Add "use client" to components that need it
    if ((content.includes('useQuery(') || content.includes('useState(') || content.includes('useEffect(') || content.includes('useRef(') || content.includes('useRouter(') || content.includes('useSearchParams(') || content.includes('useCallback(') || content.includes('useMemo(')) && !content.startsWith('"use client"')) {
      content = `"use client";\n` + content;
    }

    if (content !== original) {
      await fs.writeFile(filePath, content, 'utf-8');
      console.log(`Fixed use client in ${filePath}`);
    }
  } catch (e) {
    console.error(`Error on ${filePath}:`, e);
  }
}

async function run() {
  await processDirectory(path.join(process.cwd(), 'app'));
  await processDirectory(path.join(process.cwd(), 'src/components'));
}

run();
