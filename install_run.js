const { execSync } = require('child_process');
const fs = require('fs');
try {
  const cwd = 'c:/Users/aeliy/OneDrive/문서/AGProjects/multi-tool-dashboard';
  console.log('Installing dependencies...');
  const installOut = execSync('npm install', { cwd, encoding: 'utf-8' });
  fs.writeFileSync('c:/Users/aeliy/OneDrive/문서/AGProjects/install_out.log', installOut);
  
  console.log('Dependencies installed. Starting dev server...');
  const devProcess = require('child_process').spawn('npm', ['run', 'dev'], { cwd, stdio: 'inherit', shell: true });
} catch (e) {
  console.error('Error:', e.message);
  fs.writeFileSync('c:/Users/aeliy/OneDrive/문서/AGProjects/install_err.log', e.stderr || e.message);
}
