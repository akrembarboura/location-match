import fs from 'fs/promises';

async function run() {
  const file = 'app/request/success/page.tsx';
  let content = await fs.readFile(file, 'utf8');
  content = content.replace('import { Suspense } from "react";\n"use client";', '"use client";\nimport { Suspense } from "react";');
  await fs.writeFile(file, content);
}
run();
