import fs from 'fs/promises';

async function run() {
  // 1. app/page.tsx
  let pageContent = await fs.readFile('app/page.tsx', 'utf8');
  pageContent = pageContent.replace(/to="\/student"/g, 'href="/student"');
  pageContent = pageContent.replace(/to="\/houses"/g, 'href="/houses"');
  pageContent = pageContent.replace(/<Link\s+href="\/houses"\s+search=\{\{\s*city:\s*"(.*?)"\s*\}\}/g, '<Link href="/houses?city=$1"');
  pageContent = pageContent.replace(/search=\{\{\s*city:\s*"(.*?)"\s*\}\}/g, 'href="/houses?city=$1"');
  await fs.writeFile('app/page.tsx', pageContent);

  // 2. app/houses/page.tsx
  let housesContent = await fs.readFile('app/houses/page.tsx', 'utf8');
  // if there are multiple href="/houses", let's fix it by regex
  housesContent = housesContent.replace(/href="\/houses"\s*href="\/houses"/g, 'href="/houses"');
  housesContent = housesContent.replace(/href=\{"\/houses\?category=\$\{c.id\}"\}\s*href="\/houses"/g, 'href={`/houses?category=${c.id}`}');
  housesContent = housesContent.replace(/to="\/houses"/g, 'href="/houses"');
  // cleanup multiple hrefs
  housesContent = housesContent.replace(/href="\/houses"\s+href=\{`/g, 'href={`');
  await fs.writeFile('app/houses/page.tsx', housesContent);

  // 3. AdminShell & SiteHeader
  let adminShell = await fs.readFile('src/components/admin/AdminShell.tsx', 'utf8');
  adminShell = adminShell.replace(/activeOptions=\{\{\s*exact:\s*true\s*\}\}/g, '');
  await fs.writeFile('src/components/admin/AdminShell.tsx', adminShell);

  let siteHeader = await fs.readFile('src/components/site/SiteHeader.tsx', 'utf8');
  siteHeader = siteHeader.replace(/activeOptions=\{\{\s*exact:\s*true\s*\}\}/g, '');
  await fs.writeFile('src/components/site/SiteHeader.tsx', siteHeader);

  // 4. SearchBar & RequestForms (AppRouterInstance call signatures)
  let searchBar = await fs.readFile('src/components/rentals/SearchBar.tsx', 'utf8');
  searchBar = searchBar.replace(/router\(\{\s*to:\s*['"]\/houses['"],\s*search:\s*filters\s*\}\)/g, 'router.push(`/houses?${new URLSearchParams(filters as any).toString()}`)');
  await fs.writeFile('src/components/rentals/SearchBar.tsx', searchBar);

  let requestForms = await fs.readFile('src/components/site/RequestForms.tsx', 'utf8');
  requestForms = requestForms.replace(/router\(\{\s*to:\s*['"]\/request\/success['"],\s*search:\s*\{\s*type:\s*['"]([^'"]+)['"]\s*\}\s*\}\)/g, 'router.push(`/request/success?type=$1`)');
  await fs.writeFile('src/components/site/RequestForms.tsx', requestForms);
}
run();
