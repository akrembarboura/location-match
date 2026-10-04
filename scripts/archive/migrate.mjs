import fs from 'fs/promises';
import path from 'path';

const routesDir = path.join(process.cwd(), 'src/routes');
const appDir = path.join(process.cwd(), 'app');

const routeMapping = {
  'index.tsx': 'page.tsx',
  'about.tsx': 'about/page.tsx',
  'admin.index.tsx': 'admin/page.tsx',
  'admin.properties.tsx': 'admin/properties/page.tsx',
  'admin.requests.tsx': 'admin/requests/page.tsx',
  'dashboard.tsx': 'dashboard/page.tsx',
  'houses.$slug.tsx': 'houses/[slug]/page.tsx',
  'houses.index.tsx': 'houses/page.tsx',
  'owner.index.tsx': 'owner/page.tsx',
  'owner.list-property.tsx': 'owner/list-property/page.tsx',
  'privacy.tsx': 'privacy/page.tsx',
  'properties.$id.tsx': 'properties/[id]/page.tsx',
  'properties.index.tsx': 'properties/page.tsx',
  'request.student.tsx': 'request/student/page.tsx',
  'request.success.tsx': 'request/success/page.tsx',
  'request.summer.tsx': 'request/summer/page.tsx',
  'student.tsx': 'student/page.tsx',
  'summer.tsx': 'summer/page.tsx',
  'terms.tsx': 'terms/page.tsx'
};

async function migrateRoutes() {
  for (const [oldRoute, newRoute] of Object.entries(routeMapping)) {
    const oldPath = path.join(routesDir, oldRoute);
    const newPath = path.join(appDir, newRoute);
    
    try {
      const content = await fs.readFile(oldPath, 'utf-8');
      
      // Clean up TanStack route definitions
      let newContent = content.replace(/import { createFileRoute[^}]*?} from ['"]@tanstack\/react-router['"];?\n?/g, '');
      
      // Match component references
      newContent = newContent.replace(/export const Route = createFileRoute\([^)]+\)\({\n\s*component: ([\w]+),?\n}\);?/g, 'export default $1;');
      newContent = newContent.replace(/export const Route = createFileRoute\(['"][^'"]+['"]\)\({\s*component:\s*([^,]+),?\s*}\);?/g, 'export default $1;');

      // Remove component wrapper from createFileRoute if defined inline
      if (newContent.includes('export const Route = createFileRoute')) {
         console.log(`Manual review needed for: ${oldRoute}`);
         // Replace inline component
         newContent = newContent.replace(/export const Route = createFileRoute\([^)]+\)\({\n\s*component: (function|\(\) =>)/, 'export default $1');
         newContent = newContent.replace(/}\);?$/, '');
      }

      await fs.mkdir(path.dirname(newPath), { recursive: true });
      await fs.writeFile(newPath, newContent, 'utf-8');
      console.log(`Migrated ${oldRoute} to ${newRoute}`);
    } catch (e) {
      console.error(`Error migrating ${oldRoute}:`, e.message);
    }
  }
}

async function updateLinksInDirectory(directory) {
  const files = await fs.readdir(directory, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(directory, file.name);
    if (file.isDirectory()) {
      await updateLinksInDirectory(fullPath);
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      const content = await fs.readFile(fullPath, 'utf-8');
      let newContent = content;
      
      // Replace @tanstack/react-router imports
      if (newContent.includes('@tanstack/react-router')) {
        newContent = newContent.replace(/import {([^}]*?)} from ['"]@tanstack\/react-router['"];?/g, (match, imports) => {
          let nextImports = [];
          let lines = [];
          if (imports.includes('Link')) lines.push('import Link from "next/link";');
          if (imports.includes('useNavigate') || imports.includes('useRouter')) nextImports.push('useRouter');
          if (imports.includes('useParams')) nextImports.push('useParams');
          if (imports.includes('useSearch')) nextImports.push('useSearchParams');
          
          if (nextImports.length > 0) {
            lines.push(`import { ${nextImports.join(', ')} } from "next/navigation";`);
          }
          return lines.join('\n');
        });
        
        newContent = newContent.replace(/useNavigate\(\)/g, 'useRouter()');
        newContent = newContent.replace(/navigate\(\{ to: (['"`].*?['"`]) \}\)/g, 'push($1)');
        newContent = newContent.replace(/to=(['"`].*?['"`])/g, 'href=$1');
        newContent = newContent.replace(/to=\{/g, 'href=\{');
      }
      
      if (newContent !== content) {
        await fs.writeFile(fullPath, newContent, 'utf-8');
        console.log(`Updated imports in ${fullPath}`);
      }
    }
  }
}

async function run() {
  await migrateRoutes();
  await updateLinksInDirectory(path.join(process.cwd(), 'src/components'));
  await updateLinksInDirectory(appDir);
  console.log('Done');
}

run();
