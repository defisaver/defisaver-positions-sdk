import Web3 from 'web3';

export const getWeb3Instance = (envVar: string): Web3 => {
  const rpcUrl = process.env[envVar];
  if (!rpcUrl) {
    throw new Error(`${envVar} environment variable is not defined.`);
  }
  return new Web3(rpcUrl);
};
