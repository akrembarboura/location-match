import fs from 'fs/promises';
import path from 'path';

async function run() {
  // 1. properties/[id] params type
  const propFile = 'app/properties/[id]/page.tsx';
  let propContent = await fs.readFile(propFile, 'utf8');
  propContent = propContent.replace('{ params: { id: string } }', '{ params: Promise<{ id: string }> }');
  await fs.writeFile(propFile, propContent);

  // 2. houses/page.tsx Links
  const housesFile = 'app/houses/page.tsx';
  let housesContent = await fs.readFile(housesFile, 'utf8');
  housesContent = housesContent.replace(/to="\/houses"/g, 'href="/houses"');
  // <Link href="/houses" search={(prev) => ({ ...prev, category: undefined })}
  // -> <Link href="/houses"
  housesContent = housesContent.replace(/search=\{\(prev\) => \(\{ \.\.\.prev, category: undefined \}\)\}/g, '');
  housesContent = housesContent.replace(/search=\{\(prev\) => \(\{ \.\.\.prev, category: c\.id \}\)\}/g, 'href={`/houses?category=${c.id}`}');
  // <Link href="/houses" search={{}}
  housesContent = housesContent.replace(/<Link href="\/houses" search=\{\{\}\}/g, '<Link href="/houses"');
  await fs.writeFile(housesFile, housesContent);

  // 3. app/page.tsx Links
  const pageFile = 'app/page.tsx';
  let pageContent = await fs.readFile(pageFile, 'utf8');
  pageContent = pageContent.replace(/to="\/student"/g, 'href="/student"');
  pageContent = pageContent.replace(/to="\/houses" search=\{\{ category: c.id \}\}/g, 'href={`/houses?category=${c.id}`}');
  await fs.writeFile(pageFile, pageContent);

  // 4. AdminShell & SiteHeader activeOptions
  const adminShellFile = 'src/components/admin/AdminShell.tsx';
  let adminShellContent = await fs.readFile(adminShellFile, 'utf8');
  adminShellContent = adminShellContent.replace(/activeOptions=\{\{ exact: true \}\}/g, '');
  await fs.writeFile(adminShellFile, adminShellContent);

  const siteHeaderFile = 'src/components/site/SiteHeader.tsx';
  let siteHeaderContent = await fs.readFile(siteHeaderFile, 'utf8');
  siteHeaderContent = siteHeaderContent.replace(/activeOptions=\{\{ exact: true \}\}/g, '');
  await fs.writeFile(siteHeaderFile, siteHeaderContent);

  // 5. SearchBar & RequestForms router() -> router.push()
  const searchBarFile = 'src/components/rentals/SearchBar.tsx';
  let searchBarContent = await fs.readFile(searchBarFile, 'utf8');
  searchBarContent = searchBarContent.replace(/router\(\{\s*to: "\/houses",\s*search: filters\s*\}\)/g, 'router.push(`/houses?${new URLSearchParams(filters as any).toString()}`)');
  await fs.writeFile(searchBarFile, searchBarContent);

  const requestFormsFile = 'src/components/site/RequestForms.tsx';
  let requestFormsContent = await fs.readFile(requestFormsFile, 'utf8');
  // It might be using router({ to: "/request/success", search: { type: "student" } })
  requestFormsContent = requestFormsContent.replace(/router\(\{\s*to:\s*['"]\/request\/success['"],\s*search:\s*\{\s*type:\s*['"]([^'"]+)['"]\s*\}\s*\}\)/g, 'router.push(`/request/success?type=$1`)');
  await fs.writeFile(requestFormsFile, requestFormsContent);

  console.log('Fixed TS errors');
}
run();
