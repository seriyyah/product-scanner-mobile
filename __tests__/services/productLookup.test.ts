const mockGet = jest.fn();

jest.mock('@/services/apiService', () => ({
  BaseApiClient: { getInstance: () => ({ get: (...a: unknown[]) => mockGet(...a) }) },
}));

import { fetchProductForDisplay } from '@/services/productLookup';

const api = { get: (...a: unknown[]) => mockGet(...a) } as any;
const RESULT = { product: { barcode: '1' }, safety_score: 45 };

describe('fetchProductForDisplay', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reads from history first, which costs no scan', async () => {
    mockGet.mockResolvedValueOnce(RESULT);
    const result = await fetchProductForDisplay(api, '7622210449283');
    expect(mockGet).toHaveBeenCalledWith('/api/v1/scan/history/7622210449283');
    expect(result).toBe(RESULT);
  });

  it('falls back to the metered lookup for a product not in history', async () => {
    // Opening something never scanned is a genuine lookup and should cost a scan.
    mockGet.mockRejectedValueOnce(Object.assign(new Error('nope'), { statusCode: 404 }));
    mockGet.mockResolvedValueOnce(RESULT);
    const result = await fetchProductForDisplay(api, '7622210449283');
    expect(mockGet).toHaveBeenNthCalledWith(2, '/api/v2/scan/7622210449283');
    expect(result).toBe(RESULT);
  });

  it('does not retry the metered route when the quota is already spent', async () => {
    // A 429 on the free route means something else is wrong; retrying on the
    // metered one can only produce a second 429.
    mockGet.mockRejectedValueOnce(Object.assign(new Error('limited'), { statusCode: 429 }));
    await expect(fetchProductForDisplay(api, '1')).rejects.toMatchObject({ statusCode: 429 });
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('surfaces a rate limit from the fallback unchanged', async () => {
    mockGet.mockRejectedValueOnce(Object.assign(new Error('nope'), { statusCode: 404 }));
    mockGet.mockRejectedValueOnce(Object.assign(new Error('limited'), { statusCode: 429 }));
    await expect(fetchProductForDisplay(api, '1')).rejects.toMatchObject({ statusCode: 429 });
  });

  it('encodes the barcode in both routes', async () => {
    mockGet.mockRejectedValueOnce(Object.assign(new Error('nope'), { statusCode: 404 }));
    mockGet.mockResolvedValueOnce(RESULT);
    await fetchProductForDisplay(api, 'a/b');
    expect(mockGet).toHaveBeenNthCalledWith(1, '/api/v1/scan/history/a%2Fb');
    expect(mockGet).toHaveBeenNthCalledWith(2, '/api/v2/scan/a%2Fb');
  });
});
