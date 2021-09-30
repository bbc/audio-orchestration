/* eslint-disable */
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const topPackage = require(path.join(__dirname, '../package.json'));
const getPackagePath = folder => path.join(__dirname, '../', folder, 'package.json');

console.log('Current versions:');

const packages = topPackage.workspaces.map((folder) => {
  const packagePath = getPackagePath(folder);
  const packageJson = require(packagePath);
  return {
    name: packageJson.name,
    version: packageJson.version,
    packagePath,
    packageJson,
  };
});

packages.forEach(({ packageJson }) => {
  console.log(`${packageJson.version}\t\t${packageJson.name}`);
});
console.log('\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('>> Enter new version for all packages: ', (version) => {
  console.log('\n');

  // Make a list of all package names
  const packageNames = packages.map(({ name }) => name);

  packages.forEach(({ name, packagePath, packageJson }) => {
    // Update own version
    packageJson.version = version;
    console.log(`new version ${version}\t${packageJson.name}`);

    // Update references to other workspace packages
    Object.keys(packageJson.dependencies || {})
      .filter(depName => packageNames.includes(depName))
      .forEach((depName) => {
        console.log(`-> dependency updated: ${depName}`);
        packageJson.dependencies[depName] = `^${version}`;
      });
    
    // write back the modified package name
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  });

  rl.close();
});
