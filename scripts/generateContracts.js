const { runTypeChain, glob } = require('typechain');
const fs = require('fs');
const path = require('path');
const config = require('../src/config/contracts.ts');

async function main() {
  const abiDir = path.join(__dirname, 'temp');
  const contractDir = path.join(__dirname, '..', 'src', 'types', 'contracts', 'generated');
  try {
    fs.mkdirSync(abiDir);
    Object.entries(config).forEach(([key, value]) => {
      if (value.abi !== undefined) {
        fs.writeFileSync(path.join(abiDir, `${key}.json`), JSON.stringify(value.abi), 'utf8');
      }
    });
    const allFiles = glob(path.join(abiDir), ['*.json']);
    fs.rmSync(contractDir, { recursive: true, force: true });

    await runTypeChain({
      cwd: contractDir,
      filesToProcess: allFiles,
      allFiles,
      outDir: '.',
      target: 'web3-v1-3mihai3',
    });
  } catch (err) {
    console.error(err);
  }
  fs.rmSync(abiDir, { recursive: true, force: true });
}

main().catch(console.error);
