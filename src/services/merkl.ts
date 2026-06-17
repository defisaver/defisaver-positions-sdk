/**
 * Configurable base URL for the Merkl API (https://developers.merkl.xyz).
 *
 * Defaults to Merkl's public host. Consumers can override it via `setMerklApiUrl` — e.g. to route
 * requests through their own backend proxy that attaches a Merkl API key (the key must stay
 * server-side, and a proxy also avoids browser CORS limits on the public host).
 */
let merklApiUrl = 'https://api.merkl.xyz';

export const getMerklApiUrl = (): string => merklApiUrl;

export const setMerklApiUrl = (url: string): void => {
  merklApiUrl = url.replace(/\/+$/, '');
};
