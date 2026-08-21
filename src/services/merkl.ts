import { MerklOpportunity } from '../types';
import { LONGER_TIMEOUT } from './utils';

const MERKL_OPPORTUNITIES_URL = 'https://fe.defisaver.com/api/merkl/opportunities';

/**
 * Fetches every page matching the query. Merkl returns 20 opportunities by default, so omitting
 * `items` and advancing `page` avoids imposing a client-side maximum on the result set.
 */
export const fetchAllMerklOpportunities = async (query: Record<string, string>): Promise<MerklOpportunity[]> => {
  const opportunities: MerklOpportunity[] = [];
  let page = 0;
  let pageOpportunities: MerklOpportunity[];

  do {
    const searchParams = new URLSearchParams({ ...query, page: page.toString() });
    const res = await fetch(`${MERKL_OPPORTUNITIES_URL}?${searchParams}`, { // eslint-disable-line no-await-in-loop
      signal: AbortSignal.timeout(LONGER_TIMEOUT),
    });
    if (!res.ok) throw new Error(`Failed to fetch Merkl opportunities page ${page}`);

    const data = await res.json(); // eslint-disable-line no-await-in-loop
    if (!Array.isArray(data)) throw new Error(`Invalid Merkl opportunities response on page ${page}`);

    pageOpportunities = data as MerklOpportunity[];
    opportunities.push(...pageOpportunities);
    page += 1;
  } while (pageOpportunities.length > 0);

  return opportunities;
};
