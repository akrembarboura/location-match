import fs from 'fs/promises';

async function run() {
  const file = 'app/request/success/page.tsx';
  let content = await fs.readFile(file, 'utf8');
  content = content.replace('export default Success;', 'export default function SuccessPage() { return <Suspense fallback={<div>Loading...</div>}><Success /></Suspense>; }');
  if (!content.includes('import { Suspense }')) {
    content = 'import { Suspense } from "react";\n' + content;
  }
  await fs.writeFile(file, content);
}
run();
