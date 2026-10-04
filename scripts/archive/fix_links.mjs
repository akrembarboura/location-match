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

    // Convert import { Link } from "@tanstack/react-router" to import Link from "next/link"
    if (content.includes('@tanstack/react-router')) {
      content = content.replace(/import {([^}]*?)} from ['"]@tanstack\/react-router['"];?/g, (match, imports) => {
        let lines = [];
        if (imports.includes('Link')) lines.push('import Link from "next/link";');
        
        let nextImports = [];
        if (imports.includes('useNavigate') || imports.includes('useRouter')) nextImports.push('useRouter');
        if (imports.includes('useParams')) nextImports.push('useParams');
        if (imports.includes('useSearch')) nextImports.push('useSearchParams');
        
        if (nextImports.length > 0) {
          lines.push(`import { ${nextImports.join(', ')} } from "next/navigation";`);
        }
        return lines.join('\n');
      });
    }

    // Since I removed tanstack router imports earlier, some Link components might not be imported if it was not caught. Let's make sure `Link` is imported if `<Link` is in the file.
    if (content.includes('<Link ') && !content.includes('import Link from "next/link"') && !content.includes("import Link from 'next/link'")) {
      content = `import Link from "next/link";\n` + content;
    }

    // Convert useNavigate() to useRouter()
    content = content.replace(/useNavigate\(\)/g, 'useRouter()');
    
    // Convert navigate({ to: '/path' }) to push('/path')
    content = content.replace(/navigate\(\{\s*to:\s*(['"`][^'"`]+['"`])\s*\}\)/g, 'push($1)');

    // Convert <Link to="/path"> to <Link href="/path">
    content = content.replace(/<Link\s+to=(['"`].*?['"`])/g, '<Link href=$1');
    content = content.replace(/<Link\s+to=\{/g, '<Link href=\{');
    
    // Fix search={} pattern from tanstack: search={{ category: c.id }}
    // A bit hacky but works for the known cases: 
    // <Link href="/houses" search={{ category: c.id }}
    content = content.replace(/<Link\s+href=(['"`])([^'"`]+)\1\s+search=\{\{\s*([a-zA-Z0-9_]+)\s*:\s*([^}]+)\s*\}\}/g, '<Link href={`$2?$3=${$4}`}')
    
    // Some routes might use `params`. Wait, dynamic routes in next.js are handled via folder names.
    // Replace <Link to="/houses/$slug" params={{ slug: house.id }}> with <Link href={`/houses/${house.id}`}>
    content = content.replace(/<Link\s+href=(['"`])([^'"`]+)\1\s+params=\{\{\s*([a-zA-Z0-9_]+)\s*:\s*([^}]+)\s*\}\}/g, (match, quote, path, paramName, paramValue) => {
        let newPath = path.replace(`$${paramName}`, `\${${paramValue}}`);
        return `<Link href={\`${newPath}\`}`;
    });

    if (content !== original) {
      await fs.writeFile(filePath, content, 'utf-8');
      console.log(`Updated links in ${filePath}`);
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
