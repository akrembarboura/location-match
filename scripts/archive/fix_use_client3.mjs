import fs from 'fs/promises';
async function run() {
  const file = 'app/houses/page.tsx';
  let content = await fs.readFile(file, 'utf8');
  content = content.replace("import React from 'react';\nimport { useSearchParams } from \"next/navigation\";\n\"use client\";", '"use client";\nimport React from \'react\';\nimport { useSearchParams } from "next/navigation";');
  await fs.writeFile(file, content);
}
run();
