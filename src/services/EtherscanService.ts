import { getEnv } from '../lib/env';
import { CONFIG } from '../lib/config';

interface WalletHistory {
  nonce: number;
  ageHours: number;
  balance: string;
  firstTxDate: string | null;
}

interface WashTradingResult {
  score: number;
  flaggedDonors: string[];
  totalChecked: number;
}

interface EtherscanTransaction {
  blockNumber: string;
  blockHash: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  input: string;
  methodId: string;
  functionName: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  txreceipt_status: string;
  gasUsed: string;
  confirmations: string;
  isError: string;
}

interface EtherscanTxResponse {
  status: string;
  message: string;
  result: EtherscanTransaction[] | string; // API returns string on error
}

interface EtherscanBalanceResponse {
  status: string;
  message: string;
  result: string;
}

interface EtherscanNonceResponse {
  jsonrpc: string;
  id: number;
  result: string;
}

/**
 * Service for blockchain forensics via Etherscan API V2
 * Detects burner wallets and circular funding patterns
 * @see https://docs.etherscan.io/api-reference/endpoint/txlist
 */
export class EtherscanService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.etherscan.io/v2/api';
  private readonly chainId: number;

  constructor(chainId: number = CONFIG.CHAIN_ID) {
    this.apiKey = getEnv().ETHERSCAN_API_KEY;
    this.chainId = chainId;
  }

  private createUrl(): URL {
    const url = new URL(this.baseUrl);
    url.searchParams.set('chainid', this.chainId.toString());
    url.searchParams.set('apikey', this.apiKey);
    return url;
  }

  /**
   * Fetch with exponential backoff retry for rate limiting (429)
   */
  private async fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const response = await fetch(url);

      if (response.status === 429) {
        // Rate limited - wait with exponential backoff
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return response;
    }

    // Final attempt
    return fetch(url);
  }

  /**
   * Get wallet history to determine if it's a burner wallet
   * Low nonce + recent creation = suspicious
   */
  async getWalletHistory(address: string): Promise<WalletHistory> {
    const txUrl = this.createUrl();
    txUrl.searchParams.set('module', 'account');
    txUrl.searchParams.set('action', 'txlist');
    txUrl.searchParams.set('address', address);
    txUrl.searchParams.set('startblock', '0');
    txUrl.searchParams.set('endblock', '99999999');
    txUrl.searchParams.set('page', '1');
    txUrl.searchParams.set('offset', '1');
    txUrl.searchParams.set('sort', 'asc');

    const balanceUrl = this.createUrl();
    balanceUrl.searchParams.set('module', 'account');
    balanceUrl.searchParams.set('action', 'balance');
    balanceUrl.searchParams.set('address', address);
    balanceUrl.searchParams.set('tag', 'latest');

    const [txResponse, balanceResponse] = await Promise.all([
      this.fetchWithRetry(txUrl.toString()),
      this.fetchWithRetry(balanceUrl.toString()),
    ]);

    if (!txResponse.ok) {
      throw new Error(`Etherscan tx API error: ${txResponse.statusText}`);
    }
    if (!balanceResponse.ok) {
      throw new Error(
        `Etherscan balance API error: ${balanceResponse.statusText}`,
      );
    }

    const txData = (await txResponse.json()) as EtherscanTxResponse;
    const balanceData =
      (await balanceResponse.json()) as EtherscanBalanceResponse;

    let ageHours = 0;
    let firstTxDate: string | null = null;

    if (
      txData.status === '1' &&
      Array.isArray(txData.result) &&
      txData.result.length > 0
    ) {
      const firstTx = txData.result[0];
      const timestamp = parseInt(firstTx.timeStamp, 10) * 1000;
      firstTxDate = new Date(timestamp).toISOString();
      ageHours = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60));
    }

    const nonceUrl = this.createUrl();
    nonceUrl.searchParams.set('module', 'proxy');
    nonceUrl.searchParams.set('action', 'eth_getTransactionCount');
    nonceUrl.searchParams.set('address', address);
    nonceUrl.searchParams.set('tag', 'latest');

    const nonceResponse = await this.fetchWithRetry(nonceUrl.toString());
    if (!nonceResponse.ok) {
      throw new Error(`Etherscan nonce API error: ${nonceResponse.statusText}`);
    }
    const nonceData = (await nonceResponse.json()) as EtherscanNonceResponse;
    const nonce = nonceData.result ? parseInt(nonceData.result, 16) : 0;

    return {
      nonce,
      ageHours,
      balance: balanceData.result || '0',
      firstTxDate,
    };
  }

  /**
   * Detect wash trading / circular funding
   * Checks if the campaign creator funded the donors
   */
  async detectWashTrading(
    creatorAddress: string,
    donorAddresses: string[],
  ): Promise<WashTradingResult> {
    const flaggedDonors: string[] = [];
    const addressesToCheck = donorAddresses.slice(0, 5); // Limit to 5 for performance

    for (const donor of addressesToCheck) {
      const url = this.createUrl();
      url.searchParams.set('module', 'account');
      url.searchParams.set('action', 'txlist');
      url.searchParams.set('address', donor);
      url.searchParams.set('startblock', '0');
      url.searchParams.set('endblock', '99999999');
      url.searchParams.set('page', '1');
      url.searchParams.set('offset', '1');
      url.searchParams.set('sort', 'asc');

      try {
        const response = await this.fetchWithRetry(url.toString());
        if (!response.ok) continue;

        const data = (await response.json()) as EtherscanTxResponse;

        if (
          data.status === '1' &&
          Array.isArray(data.result) &&
          data.result.length > 0
        ) {
          const firstTx = data.result[0];
          // Check if creator funded this donor
          if (firstTx.from.toLowerCase() === creatorAddress.toLowerCase()) {
            flaggedDonors.push(donor);
          }
        }
      } catch {
        // Continue checking other donors
      }
    }

    const score =
      addressesToCheck.length > 0
        ? Math.round((flaggedDonors.length / addressesToCheck.length) * 100)
        : 0;

    return {
      score,
      flaggedDonors,
      totalChecked: addressesToCheck.length,
    };
  }
}
