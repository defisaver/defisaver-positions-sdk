import { fetchAllMerklOpportunities } from '../src/services/merkl';
import { MerklOpportunity } from '../src/types';

const { assert } = require('chai');

const opportunity = (id: string) => ({ id } as MerklOpportunity);

describe('Merkl opportunity pagination', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('fetches every page without setting an items limit', async () => {
    const pages = [
      [opportunity('first'), opportunity('second')],
      [opportunity('third')],
      [],
    ];
    const requestedUrls: string[] = [];

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = input.toString();
      requestedUrls.push(url);
      const page = Number(new URL(url).searchParams.get('page'));
      return {
        ok: true,
        json: async () => pages[page],
      } as Response;
    }) as typeof fetch;

    const result = await fetchAllMerklOpportunities({ mainProtocolId: 'aave', status: 'LIVE' });

    assert.deepEqual(result.map(({ id }) => id), ['first', 'second', 'third']);
    assert.deepEqual(requestedUrls.map(url => new URL(url).searchParams.get('page')), ['0', '1', '2']);
    assert.isTrue(requestedUrls.every(url => !new URL(url).searchParams.has('items')));
  });
});
