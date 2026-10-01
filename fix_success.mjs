import fs from 'fs/promises';

async function run() {
  const file = 'app/request/success/page.tsx';
  let content = await fs.readFile(file, 'utf8');
  content = content.replace('Route.useSearch()', 'useSearchParams()');
  content = content.replace('const { type } = useSearchParams();', 'const searchParams = useSearchParams(); const type = searchParams.get("type");');
  
  if (!content.includes('import { useSearchParams }')) {
    content = 'import { useSearchParams } from "next/navigation";\n' + content;
  }
  
  if (!content.includes('"use client"')) {
    content = '"use client";\n' + content;
  }
  
  await fs.writeFile(file, content);
}
run();
