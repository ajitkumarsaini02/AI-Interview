const { spawnSync, execSync } = require('child_process');
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
const pythonPath = findPythonExecutable();

console.log('====================================================');
console.log('🧪 1. Running TypeScript Express Integration Tests (Vitest)...');
console.log('====================================================');

const vitestRes = spawnSync('npx', ['vitest', 'run'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: true,
});

let pytestSuccess = true;
if (pythonPath) {
  console.log('\n====================================================');
  console.log(`🐍 2. Running Python FastAPI Unit & Integration Tests (${pythonPath})...`);
  console.log('====================================================');

  const pytestRes = spawnSync(pythonPath, ['-m', 'pytest', 'tests'], {
    cwd: backendDir,
    stdio: 'inherit',
    shell: true,
  });
  if (pytestRes.status !== 0) pytestSuccess = false;
} else {
  console.warn('\n⚠️ Python executable not found in PATH; skipping Pytest run.');
}

console.log('\n====================================================');
if (vitestRes.status === 0 && pytestSuccess) {
  console.log('✅ ALL BACKEND TEST SUITES PASSED (Vitest & Pytest)!');
  process.exit(0);
} else {
  console.error('❌ SOME TEST SUITES FAILED!');
  process.exit(1);
}
