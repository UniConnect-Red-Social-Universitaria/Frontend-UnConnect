const os = require('os');
const net = require('net');
const { spawn } = require('child_process');

function getLocalIPv4() {
  const interfaces = os.networkInterfaces();
  const isLikelyVirtualInterface = (name = '') => {
    const normalized = name.toLowerCase();
    return [
      'virtual',
      'vmware',
      'vbox',
      'vethernet',
      'hyper-v',
      'docker',
      'wsl',
      'tailscale',
      'zerotier',
      'loopback',
      'hamachi',
      'bluetooth',
    ].some((keyword) => normalized.includes(keyword));
  };

  for (const [name, addresses] of Object.entries(interfaces)) {
    if (!addresses) continue;

    for (const address of addresses) {
      const family = typeof address.family === 'string' ? address.family : address.family === 4 ? 'IPv4' : 'IPv6';
      if (family === 'IPv4' && !address.internal) {
        if (!isLikelyVirtualInterface(name)) {
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

function estaPuertoDisponible(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close(() => {
        resolve(true);
      });
    });

    server.listen(port, '0.0.0.0');
  });
}

async function buscarPuertoLibre(inicio = 19000, fin = 19100) {
  for (let puerto = inicio; puerto <= fin; puerto += 1) {
    // eslint-disable-next-line no-await-in-loop
    const disponible = await estaPuertoDisponible(puerto);
    if (disponible) {
      return puerto;
    }
  }
  return null;
}

async function main() {
  const env = { ...process.env };

  if (mode === 'lan') {
    if (process.platform === 'win32') {
      console.log('Windows detected: leaving REACT_NATIVE_PACKAGER_HOSTNAME unset so Expo can pick a reachable host for QR.');
    } else {
      env.REACT_NATIVE_PACKAGER_HOSTNAME = getLocalIPv4();
      console.log(`Using REACT_NATIVE_PACKAGER_HOSTNAME=${env.REACT_NATIVE_PACKAGER_HOSTNAME}`);
    }
  }

  const puertoExpo = await buscarPuertoLibre(19000, 19100);
  if (!puertoExpo) {
    console.error('No free Expo port found between 19000 and 19100.');
    process.exit(1);
    return;
  }

  console.log(`Using Expo port ${puertoExpo}`);

  let command;
  let commandArgs;

  if (useNode20) {
    if (process.platform === 'win32') {
      command = 'cmd.exe';
      commandArgs = [
        '/d',
        '/s',
        '/c',
        `npx -y node@20 node_modules/expo/bin/cli start . --${mode} -c --port ${puertoExpo}`,
      ];
    } else {
      command = 'npx';
      commandArgs = [
        '-y',
        'node@20',
        'node_modules/expo/bin/cli',
        'start',
        '.',
        `--${mode}`,
        '-c',
        '--port',
        String(puertoExpo),
      ];
    }
  } else {
    command = process.execPath;
    commandArgs = [
      'node_modules/expo/bin/cli',
      'start',
      '.',
      `--${mode}`,
      '-c',
      '--port',
      String(puertoExpo),
    ];
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
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
