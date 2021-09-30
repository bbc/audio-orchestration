const fs = require('fs');
const path = require('path');

// Import all the package.json files and check that dependencies listed in multiples have the same
// version specification.

const root = path.resolve(__dirname, '../');

const topLevelPackage = require(path.join(root, 'package.json'));

const {
  workspaces,
} = topLevelPackage;

const workspacePackages = workspaces.map(w => require(path.join(root, w, 'package.json')));
const workspacePackageNames = workspacePackages.map(({ name }) => name);

const packages = [
  topLevelPackage,
  ...workspacePackages,
];

const allDependencies = new Map();

let packageVersionErrors = 0;
let dependencyVersionErrors = 0;

// go through all workspaces and check that the package.json version is the same
const { version: firstWorkspaceVersion } = workspacePackages[0]
workspacePackages.forEach(({ name, version }) => {
  if (version !== firstWorkspaceVersion) {
    console.log(`${name} ${version} should be ${firstWorkspaceVersion}, or all workspace packages should have the same version.`);
    packageVersionErrors += 1;
  }
});

// go through all packages, including the top level, and extract the dependencies
packages.forEach(({
  name, dependencies, peerDependencies, devDependencies,
}) => {
  Object.entries({
    ...dependencies,
    ...peerDependencies,
    ...devDependencies,
  }).forEach(([depName, version]) => {
    if (!allDependencies.has(depName)) {
      allDependencies.set(depName, []);
    }
    allDependencies.get(depName).push({ name, version });

    // Also check that local dependencies are correctly versioned
    if (workspacePackageNames.includes(depName)) {
      if (version !== `^${firstWorkspaceVersion}`) {
        console.log(`Local package ${depName} required as ${version} by ${name}, should be ^${firstWorkspaceVersion}.`);
        dependencyVersionErrors += 1;
      }
    }
  });
});

// go through all dependencies found and check that the the semVer specs match exactly
allDependencies.forEach((uses, name) => {
  if (Object.keys(uses).length > 1) {
    if (uses.length > 0) {
      const { version: firstVersion } = uses[0];
      if (!uses.every(({ version }) => version === firstVersion)) {
        const usageStrings = uses.map(({
          name: userName, version,
        }) => `${name} required as ${version} by ${userName}`);
        console.log(`${name}:\n\t${usageStrings.join('\n\t')}`);
        dependencyVersionErrors += 1;
      }
    }
  }
});


if (packageVersionErrors || dependencyVersionErrors) {
  console.log(`\n${packageVersionErrors} package version errors, ${dependencyVersionErrors} dependency version errors.`);
  process.exit(1);
} else {
  console.log('All looks good!');
}
