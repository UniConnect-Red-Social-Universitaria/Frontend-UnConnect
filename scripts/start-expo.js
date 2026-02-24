const os = require('os');
const { spawn } = require('child_process');

function getLocalIPv4() {
  const interfaces = os.networkInterfaces();

  for (const [name, addresses] of Object.entries(interfaces)) {
    if (!addresses) continue;

    for (const address of addresses) {
      const family = typeof address.family === 'string' ? address.family : address.family === 4 ? 'IPv4' : 'IPv6';
      if (family === 'IPv4' && !address.internal) {
        if (!name.toLowerCase().includes('virtual') && !name.toLowerCase().includes('vmware')) {
          return address.address;
        }
      }
    }
  }

  for (const addresses of Object.values(interfaces)) {
    if (!addresses) continue;

    for (const address of addresses) {
      const family = typeof address.family === 'string' ? address.family : address.family === 4 ? 'IPv4' : 'IPv6';
      if (family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }

  return '127.0.0.1';
}

const args = new Set(process.argv.slice(2));
const mode = args.has('--tunnel') ? 'tunnel' : 'lan';
const useNode20 = args.has('--node20');

const env = { ...process.env };

if (mode === 'lan') {
  env.REACT_NATIVE_PACKAGER_HOSTNAME = getLocalIPv4();
  console.log(`Using REACT_NATIVE_PACKAGER_HOSTNAME=${env.REACT_NATIVE_PACKAGER_HOSTNAME}`);
}

let command;
let commandArgs;

if (useNode20) {
  if (process.platform === 'win32') {
    command = 'cmd.exe';
    commandArgs = ['/d', '/s', '/c', `npx -y node@20 node_modules/expo/bin/cli start . --${mode} -c`];
  } else {
    command = 'npx';
    commandArgs = ['-y', 'node@20', 'node_modules/expo/bin/cli', 'start', '.', `--${mode}`, '-c'];
  }
} else {
  command = process.execPath;
  commandArgs = ['node_modules/expo/bin/cli', 'start', '.', `--${mode}`, '-c'];
}

const child = spawn(command, commandArgs, {
  stdio: 'inherit',
  env,
  shell: false,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});
