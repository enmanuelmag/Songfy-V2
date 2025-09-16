import chalk from 'chalk';
import * as dotenv from 'dotenv';
import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import * as path from 'node:path';

import AppConfig from '../app.config';
import { name as AppName } from '../package.json';

import type { BuildOptions } from './task';

dotenv.config({
  path: path.join(__dirname, '..', '.env'),
  override: false,
});

export const executeTask = async (
  task: string,
  action: () => any | Promise<any>
) => {
  console.log(chalk.green.bgCyan.bold('[LOG]') + ' Executing task:', task);

  await action();
};

export const getBuildCommands = (params: BuildOptions) => {
  const { local, output, platform, profile, binaryVersion } = params;

  if (binaryVersion === 'latest') {
    const latestVersion = readBuiltVersions().versions.at(-1);

    if (!latestVersion) {
      throw new Error('No versions found');
    }

    const dirOutputAndroid = path.join(
      output,
      `${AppName}-${latestVersion}-${profile}.aab`
    );

    const dirOutputIos = path.join(
      output,
      `${AppName}-${latestVersion}-${profile}.ipa`
    );

    fs.accessSync(dirOutputAndroid, fs.constants.F_OK);

    fs.accessSync(dirOutputIos, fs.constants.F_OK);

    return {
      commandBuild: {
        android: '',
        ios: '',
      },
      dirOutputAndroid: ['all', 'android'].includes(platform)
        ? dirOutputAndroid
        : '',
      dirOutputIos: ['all', 'ios'].includes(platform) ? dirOutputIos : '',
    };
  } else if (binaryVersion) {
    const dirOutputAndroid = path.join(
      output,
      `${AppName}-${binaryVersion}-${profile}.aab`
    );

    const dirOutputIos = path.join(
      output,
      `${AppName}-${binaryVersion}-${profile}.ipa`
    );

    fs.accessSync(dirOutputAndroid, fs.constants.F_OK);

    fs.accessSync(dirOutputIos, fs.constants.F_OK);

    return {
      commandBuild: {
        android: '',
        ios: '',
      },
      dirOutputAndroid: ['all', 'android'].includes(platform)
        ? dirOutputAndroid
        : '',
      dirOutputIos: ['all', 'ios'].includes(platform) ? dirOutputIos : '',
    };
  }

  const dirOutputAndroid = path.join(
    output,
    `${AppName}-${AppConfig.version}-${profile}.aab`
  );

  const dirOutputIos = path.join(
    output,
    `${AppName}-${AppConfig.version}-${profile}.ipa`
  );

  const commandBuild = {
    android: '',
    ios: '',
  };

  const cmdBuildAndroid = `eas build --platform android --profile ${profile} ${
    local ? '--local' : ''
  } --output ${dirOutputAndroid} --non-interactive`;

  const cmdBuildIOS = `eas build --platform ios --profile ${profile} ${
    local ? '--local' : ''
  } --output ${dirOutputIos} --non-interactive`; // --non-interactive

  if (platform === 'android') {
    commandBuild.android = cmdBuildAndroid;
  } else if (platform === 'ios') {
    // clipboard.writeSync(cmdBuildIOS);
    commandBuild.ios = cmdBuildIOS;
  } else {
    commandBuild.android = cmdBuildAndroid;
    commandBuild.ios = cmdBuildIOS;
    // clipboard.writeSync(cmdBuildIOS);
  }

  return {
    commandBuild,
    dirOutputAndroid,
    dirOutputIos,
  };
};

export const getSubmitCommands = (
  dirAndroid: string,
  dirIOS: string,
  params: BuildOptions
) => {
  const { local, platform, submit } = params; // profile

  const commandSubmit = {
    android: '',
    ios: '',
  };

  const cmdSubmitAndroid = `eas submit --platform android --profile closed ${
    local ? `--path ${dirAndroid}` : '--latest'
  } --non-interactive`;

  const cmdSubmitIOS = `eas submit --platform ios --profile closed ${
    local ? `--path ${dirIOS}` : '--latest'
  } --non-interactive`;

  if (submit) {
    if (platform === 'android') {
      commandSubmit.android = cmdSubmitAndroid;
    } else if (platform === 'ios') {
      commandSubmit.ios = cmdSubmitIOS;
    } else {
      commandSubmit.android = cmdSubmitAndroid;
      commandSubmit.ios = cmdSubmitIOS;
    }
  }

  return {
    commandSubmit,
  };
};

export const getEASUpdateCommands = (params: BuildOptions) => {
  const { message } = params;

  const { version } = AppConfig;

  const cmdEASUpdate = `eas update --branch production --message "Prod-${version}: ${message}"`;

  return {
    cmdEASUpdate,
  };
};

function printLine(
  data: any,
  lines: Array<any>,
  maxLines: number,
  taskOutputs: Array<string>,
  typeOutput: 'stdout' | 'stderr' = 'stdout'
) {
  process.stdout.write(data);

  // Dividir la salida en líneas
  const outputLines = (data.toString() as string)
    .split('\n')
    .filter((line) => line.trim() !== '');

  // Agregar las líneas a nuestro array
  lines = lines.concat(outputLines);

  // Mantener solo las últimas maxLines líneas
  if (lines.length > maxLines) {
    lines = lines.slice(lines.length - maxLines);
  }

  // Limpiar la consola y mostrar las últimas maxLines líneas
  const colorChalk = typeOutput === 'stdout' ? chalk.dim : chalk.dim;

  console.clear();
  console.log(taskOutputs.join('\n') + '\n' + colorChalk(lines.join('\n')));

  return lines;
}

export function runCommand(
  name: string,
  command: string,
  taskOutputs: Array<string>,
  maxLines = 15,
  ignoreError = false
) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, { shell: true });

    let lines: Array<any> = [];

    child.stdout.on('data', (data) => {
      lines = printLine(data, lines, maxLines, taskOutputs, 'stdout');
    });

    child.stderr.on('data', (data) => {
      lines = printLine(data, lines, maxLines, taskOutputs, 'stderr');
    });

    child.on('close', (code) => {
      if (!ignoreError && code !== 0) {
        console.log(
          chalk(
            chalk.red.bgRed.bold('[ERROR]') +
              chalk.dim(` ├── Command failed: ${command}`)
          )
        );
        console.log(
          chalk(
            chalk.red.bgRed.bold('[ERROR]') +
              chalk.dim(` └── Task failed with code: ${code}`)
          )
        );
        return reject(code);
      }

      console.clear();
      taskOutputs.push(
        chalk(
          chalk.green.bgCyan.bold('[LOG]') +
            chalk.dim(` └── Task completed with code: ${code}`)
        )
      );
      console.log(taskOutputs.join('\n'));
      resolve(code);
    });
  });
}

export function checkBuiltVersions(taskOutputs: Array<string>) {
  if (!AppConfig.version) {
    throw new Error('Version not provided');
  }

  const builtVersions = readBuiltVersions();

  taskOutputs.push(
    chalk.green.bgCyan.bold('[LOG]') +
      ' Built versions: ' +
      builtVersions.versions.slice(-5).join(', ')
  );

  if (builtVersions.versions.includes(AppConfig.version)) {
    taskOutputs.push(
      chalk.red.bgRed.bold('[ERROR]') +
        ' Version already built:' +
        AppConfig.version
    );
    console.log(taskOutputs.join('\n'));
    process.exit(1);
  }
}

export function addBuiltVersion() {
  if (!AppConfig.version) {
    throw new Error('Version not provided');
  }

  const builtVersions = readBuiltVersions();

  if (builtVersions.versions.includes(AppConfig.version)) {
    return;
  }

  builtVersions.versions.push(AppConfig.version);

  fs.writeFileSync(
    path.join('scripts', 'builtVersions.json'),
    JSON.stringify(builtVersions)
  );

  execSync(
    `git add scripts/builtVersions.json && git commit -m "ci: add built version ${AppConfig.version}"`
  );
}

export function readBuiltVersions() {
  return JSON.parse(
    fs.readFileSync(path.join('scripts', 'builtVersions.json'), 'utf-8')
  ) as {
    versions: Array<string>;
  };
}
