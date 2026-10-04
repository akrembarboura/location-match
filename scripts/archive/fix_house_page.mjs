import fs from 'fs/promises';

async function run() {
  const file = 'app/houses/[slug]/page.tsx';
  let content = await fs.readFile(file, 'utf8');
  content = content.replace('const { slug } = Route.useParams();', 'const { slug } = useParams() as { slug: string };');
  if (!content.includes('import { useParams }')) {
    content = 'import { useParams } from "next/navigation";\n' + content;
  }
  if (!content.includes('"use client"')) {
    content = '"use client";\n' + content;
  }
  await fs.writeFile(file, content);
}
run();
