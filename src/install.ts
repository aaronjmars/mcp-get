import { Package } from './types/index.js';
import { installPackage as installPkg } from './utils/package-management.js';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { loadPackage } from './utils/package-registry.js';

async function promptForRuntime(): Promise<'node' | 'python' | 'go'> {
  const { runtime } = await inquirer.prompt<{ runtime: 'node' | 'python' | 'go' }>([
    {
      type: 'list',
      name: 'runtime',
      message: 'What runtime does this package use?',
      choices: [
        { name: 'Node.js', value: 'node' },
        { name: 'Python', value: 'python' },
        { name: 'Go', value: 'go' }
      ]
    }
  ]);
  return runtime;
}

function createUnknownPackage(packageName: string, runtime: 'node' | 'python' | 'go'): Package {
  return {
    name: packageName,
    description: 'Unverified package',
    runtime,
    vendor: '',
    sourceUrl: '',
    homepage: '',
    license: ''
  };
}

export async function installPackage(pkg: Package): Promise<void> {
  return installPkg(pkg);
}

export async function install(packageName: string): Promise<void> {
  const pkg = loadPackage(packageName);

  if (!pkg) {
    console.warn(chalk.yellow(`Package ${packageName} not found in the curated list.`));
    
    const { proceedWithInstall } = await inquirer.prompt<{ proceedWithInstall: boolean }>([
      {
        type: 'confirm',
        name: 'proceedWithInstall',
        message: `Would you like to try installing ${packageName} anyway? This package hasn't been verified.`,
        default: false
      }
    ]);

    if (proceedWithInstall) {
      console.log(chalk.cyan(`Proceeding with installation of ${packageName}...`));
      
      // Prompt for runtime for unverified packages
      const runtime = await promptForRuntime();
      
      // Create a basic package object for unverified packages
      const unknownPkg = createUnknownPackage(packageName, runtime);
      await installPkg(unknownPkg);
    } else {
      console.log('Installation cancelled.');
      process.exit(1);
    }
    return;
  }

  await installPkg(pkg);
}
