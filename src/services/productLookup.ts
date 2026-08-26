import type { ScanResult } from '@/types';

interface Getter {
  get<T>(path: string): Promise<T>;
}

/**
 * Loads a product for display.
 *
 * The scan routes are metered, so a free user who spent their hourly quota could
 * not open anything from their own history. Re-reading something already scanned
 * goes through the history route, which is exempt precisely because it serves
 * nothing the caller has not already seen. Only a genuinely new product falls
 * through to the metered lookup, where a scan is the right cost.
 */
export const fetchProductForDisplay = async (
  api: Getter,
  barcode: string,
): Promise<ScanResult> => {
  const encoded = encodeURIComponent(barcode);
  try {
    return await api.get<ScanResult>(`/api/v1/scan/history/${encoded}`);
  } catch (error) {
    const status = (error as { statusCode?: number })?.statusCode;
    // Only "not in your history" justifies spending a scan. Anything else — a
    // spent quota above all — would just fail again on the metered route.
    if (status !== 404) throw error;
    return api.get<ScanResult>(`/api/v2/scan/${encoded}`);
  }
};
