const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function findPythonExecutable() {
  const candidates = [
    path.join(process.env.LOCALAPPDATA || '', 'Python', 'bin', 'python.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python312', 'python.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python311', 'python.exe'),
    'python',
    'python3',
    'py',
  ];

  for (const candidate of candidates) {
    if (candidate.endsWith('.exe') && !fs.existsSync(candidate)) {
      continue;
    }
    try {
      const output = execSync(`"${candidate}" --version`, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
      if (output && output.includes('Python')) {
        return candidate;
      }
    } catch (e) {
      // ignore
    }
  }
  return null;
}

const backendDir = path.resolve(__dirname, '..', 'backend');
const useNode = process.env.USE_NODE === 'true' || process.env.BACKEND === 'node';
const pythonPath = findPythonExecutable();

if (!useNode && pythonPath) {
  console.log(`🐍 Starting Python FastAPI Backend using: ${pythonPath}`);
  const child = spawn(pythonPath, ['-m', 'uvicorn', 'app.main:app', '--port', '4000', '--reload'], {
    cwd: backendDir,
    stdio: 'inherit',
    shell: true,
  });
  child.on('exit', (code) => process.exit(code || 0));
} else {
  console.log('⚡ Starting TypeScript Express Backend using tsx...');
  const child = spawn('npx', ['tsx', 'src/server.ts'], {
    cwd: backendDir,
    stdio: 'inherit',
    shell: true,
  });
  child.on('exit', (code) => process.exit(code || 0));
}
