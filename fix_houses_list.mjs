import fs from 'fs/promises';

async function run() {
  const file = 'app/houses/page.tsx';
  let content = await fs.readFile(file, 'utf8');
  content = content.replace('const search = Route.useSearch();', `const searchParams = useSearchParams();
  const search = {
    city: searchParams.get("city") || undefined,
    category: searchParams.get("category") || undefined,
    guests: searchParams.get("guests") ? Number(searchParams.get("guests")) : undefined,
    checkIn: searchParams.get("checkIn") || undefined,
    checkOut: searchParams.get("checkOut") || undefined
  };`);
  if (!content.includes('import { useSearchParams }')) {
    content = 'import { useSearchParams } from "next/navigation";\n' + content;
  }
  
  if (!content.includes('<Suspense')) {
     content = content.replace('export default HousesPage;', 'export default function Page() { return <React.Suspense fallback={<div>Loading...</div>}><HousesPage /></React.Suspense>; }');
     content = "import React from 'react';\n" + content;
  }
  
  await fs.writeFile(file, content);
}
run();
