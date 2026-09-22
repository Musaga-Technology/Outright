// Regenerates src/abi/outright.ts from the Foundry artifact. Run `forge build` in ../contracts first.
import { readFileSync, writeFileSync } from 'node:fs'
const { abi } = JSON.parse(readFileSync('../contracts/out/Outright.sol/Outright.json', 'utf8'))
writeFileSync(
  'src/abi/outright.ts',
  `// Generated from contracts/out/Outright.sol/Outright.json — run \`npm run abi\` after changing the contract.\nexport const outrightAbi = ${JSON.stringify(abi, null, 2)} as const\n`,
)
console.log(`wrote ${abi.length} ABI entries`)
