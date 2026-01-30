import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.cache',
  '.config',
  '.upm',
  'dist',
  '.replit',
  'replit.nix',
  '.breakpoints',
  'package-lock.json',
  'scripts/push-to-github.ts',
  '/tmp'
];

function shouldIgnore(filePath: string): boolean {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (shouldIgnore(fullPath)) return;
    
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

async function main() {
  const repoName = 'loads-of-love-scheduler';
  
  console.log('Connecting to GitHub...');
  const octokit = await getGitHubClient();
  
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`Authenticated as: ${user.login}`);
  
  let repo;
  let repoExists = false;
  
  try {
    const { data } = await octokit.repos.get({
      owner: user.login,
      repo: repoName
    });
    repo = data;
    repoExists = true;
    console.log(`Repository already exists: ${repo.html_url}`);
  } catch (error: any) {
    if (error.status === 404) {
      console.log(`Creating repository: ${repoName}...`);
      const { data } = await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        description: 'Loads of Love - Free Laundry Event Scheduling Application',
        private: false,
        auto_init: true
      });
      repo = data;
      console.log(`Repository created: ${repo.html_url}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      throw error;
    }
  }
  
  console.log('Collecting files...');
  const files = getAllFiles('.');
  console.log(`Found ${files.length} files to upload`);
  
  let uploaded = 0;
  let failed = 0;
  
  for (const file of files) {
    const relativePath = file.startsWith('./') ? file.slice(2) : file;
    
    try {
      const content = fs.readFileSync(file);
      const base64Content = content.toString('base64');
      
      let sha: string | undefined;
      try {
        const { data: existingFile } = await octokit.repos.getContent({
          owner: user.login,
          repo: repoName,
          path: relativePath
        });
        if ('sha' in existingFile) {
          sha = existingFile.sha;
        }
      } catch (e) {
      }
      
      await octokit.repos.createOrUpdateFileContents({
        owner: user.login,
        repo: repoName,
        path: relativePath,
        message: sha ? `Update ${relativePath}` : `Add ${relativePath}`,
        content: base64Content,
        sha: sha
      });
      
      uploaded++;
      console.log(`[${uploaded}/${files.length}] Uploaded: ${relativePath}`);
    } catch (error: any) {
      failed++;
      console.error(`Failed to upload ${relativePath}: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Done! Uploaded ${uploaded} files, ${failed} failed.`);
  console.log(`📁 Repository: https://github.com/${user.login}/${repoName}`);
}

main().catch(console.error);
