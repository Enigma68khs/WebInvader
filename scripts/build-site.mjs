import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'dist');
const staticFiles = ['index.html', 'styles.css', 'game.js'];

const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabasePublishableKey = (process.env.SUPABASE_PUBLISHABLE_KEY || '').trim();

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

for (const file of staticFiles) {
  await cp(path.join(rootDir, file), path.join(outputDir, file));
}

const runtimeConfig = supabaseUrl && supabasePublishableKey
  ? `window.WEB_INVADER_SUPABASE_CONFIG = window.WEB_INVADER_SUPABASE_CONFIG || {
    url: ${JSON.stringify(supabaseUrl)},
    anonKey: ${JSON.stringify(supabasePublishableKey)}
};
`
  : `window.WEB_INVADER_SUPABASE_CONFIG = window.WEB_INVADER_SUPABASE_CONFIG || {
    url: '',
    anonKey: ''
};
`;

await writeFile(path.join(outputDir, 'supabase-config.js'), runtimeConfig, 'utf8');
await writeFile(
  path.join(outputDir, 'supabase-config.local.js'),
  "window.WEB_INVADER_SUPABASE_CONFIG = window.WEB_INVADER_SUPABASE_CONFIG || {};\n",
  'utf8',
);
