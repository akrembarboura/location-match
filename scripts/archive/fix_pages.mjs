import fs from 'fs/promises';
import path from 'path';

async function processDirectory(dir) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
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

    if (content.includes('export const Route = createFileRoute')) {
      console.log(`Fixing ${filePath}`);
      
      // We will just find the component and export it as default, then remove the route block entirely.
      // Match something like component: ComponentName
      const componentMatch = content.match(/component:\s*([A-Za-z0-9_]+)/);
      if (componentMatch && componentMatch[1] !== 'function') {
        const compName = componentMatch[1];
        content = content.replace(/export const Route = createFileRoute[\s\S]*?(?=\n\n|\n[a-zA-Z])/g, '');
        if (!content.includes(`export default ${compName}`)) {
          content += `\nexport default ${compName};\n`;
        }
      } else {
        // Just strip the `export const Route...` and assume the main function is exported or we can add export default
        content = content.replace(/export const Route = createFileRoute[\s\S]*?\)\(\{[\s\S]*?component:\s*(function[^{]*{[\s\S]*?)\n\}\);/g, 'export default $1');
      }

      // Cleanup dangling loader/head if they were left behind by bad regex
      content = content.replace(/head: \(\) => \(\{[\s\S]*?\}\),/g, '');
      content = content.replace(/loader: \([^)]+\) =>[\s\S]*?\]\),/g, '');
    }
    
    // Add "use client" if needed
    if ((content.includes('useQuery') || content.includes('useState') || content.includes('useEffect') || content.includes('useRouter') || content.includes('useSearchParams')) && !content.includes('"use client"') && !content.includes("'use client'")) {
      content = `"use client";\n\n` + content;
    }

    if (content !== original) {
      await fs.writeFile(filePath, content, 'utf-8');
    }
  } catch (e) {
    console.error(`Error on ${filePath}:`, e);
  }
}

processDirectory(path.join(process.cwd(), 'app')).then(() => console.log('Done fixing pages'));
