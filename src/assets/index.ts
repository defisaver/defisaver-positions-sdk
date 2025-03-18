import { assetAmountInEth, getAssetInfo } from '@defisaver/tokens';
import Web3 from 'web3';
import { EthAddress, NetworkNumber } from '../types/common';
import { compareAddresses, isAddress } from '../services/utils';
import { BalanceScannerContract, getErc20Contract } from '../contracts';

export const getAssetBalance = async (
  asset: string,
  address: EthAddress,
  chainId: NetworkNumber,
  web3: Web3,
): Promise<string> => {
  if (!address) return '0';
  // noinspection JSUnusedAssignment
  let data = '';

  const isAssetAddress = isAddress(asset);

  const network: NetworkNumber = chainId;
  const isOptimism = network === 10;

  if (
    !isOptimism
    && (asset === 'ETH' || compareAddresses(asset, '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'))
  ) {
    data = await web3.eth.getBalance(address);
  } else {
    let _asset = isAssetAddress ? asset : getAssetInfo(asset).address;

    if (isOptimism && compareAddresses(_asset, '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')) {
      _asset = '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000';
    }

    const contract = await getErc20Contract(_asset, web3);
    data = (await contract.methods.balanceOf(address).call()).toString();
  }

  return isAssetAddress
  // @ts-ignore
    ? getEthAmountForDecimals(data, (await getERC20TokenData(asset)).decimals)
    : assetAmountInEth(data, asset);
};

export const getAssetsBalances = async (assets: string[], address: EthAddress, networkId: NetworkNumber, web3: Web3): Promise<string[]> => {
  const contract = BalanceScannerContract(web3, networkId);

  const balancesFromChain = [...await contract.methods.tokensBalance(address, assets.map(a => getAssetInfo(a, networkId).address)).call()];

  const balances: string[] = balancesFromChain.map((item, i) => (
    item.success
      ? assetAmountInEth(web3.utils.hexToNumberString(item.data), assets[i])
      : '0'
  ));

  const ethIndex = assets.indexOf('ETH');
  if (ethIndex !== -1) {
    balances[ethIndex] = await getAssetBalance('ETH', address, networkId, web3);
  }

  return balances;
};
