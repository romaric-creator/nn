// dev-runner.cjs
const { spawn } = require('child_process');
const electron = require('electron'); // Méthode recommandée pour obtenir le chemin
const path = require('path');

let electronProcess = null;
let viteProcess = null;

const { execSync } = require('child_process');

function killPort(port) {
  try {
    console.log(`Tentative de libération du port ${port}...`);
    if (process.platform === 'win32') {
      execSync(`netstat -ano | findstr :${port} | findstr LISTENING && for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port} ^| findstr LISTENING') do taskkill /f /pid %a`, { stdio: 'ignore' });
    } else {
      execSync(`lsof -t -i:${port} | xargs kill -9`, { stdio: 'ignore' });
    }
    console.log(`Port ${port} libéré avec succès.`);
  } catch (e) {
    console.log(`Port ${port} déjà libre ou erreur ignorée.`);
  }
}

function startVite() {
  killPort(5173);
  viteProcess = spawn(
    'vite',
    [],
    {
      shell: true,
      env: { ...process.env, NODE_ENV: 'development' }
    }
  );

  console.log('--- Démarrage de Vite, en attente du serveur de développement... ---');

  viteProcess.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(output);

    // Condition pour démarrer Electron
    if (output.includes('Local:') && !electronProcess) {
      startElectron();
    }
  });

  viteProcess.stderr.on('data', (data) => {
    process.stderr.write(data.toString());
  });

  viteProcess.on('close', () => process.exit());
}

function startElectron() {
  console.log('\n--- Vite est prêt, démarrage d\'Electron... ---\n');
  electronProcess = spawn(
    electron, // Utiliser le chemin obtenu via require
    ['src/main/main.cjs', '--no-sandbox'],
    {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' }
    }
  );

  electronProcess.on('close', (code) => {
    console.log(`\n--- Electron s'est arrêté avec le code ${code}, arrêt de Vite... ---\n`);
    if (viteProcess) {
      viteProcess.kill();
    }
    process.exit();
  });
}

function cleanup() {
  if (viteProcess) viteProcess.kill();
  if (electronProcess) electronProcess.kill();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

startVite();
