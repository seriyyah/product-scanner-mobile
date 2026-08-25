/**
 * The SDK is a native module: absent in Expo Go, on web, and in tests. Every path
 * has to degrade to a no-op rather than throw, because a purchasing problem must
 * never stop someone scanning a product.
 */
import { PurchasesService } from '../../src/services/purchasesService';

describe('PurchasesService without configuration', () => {
  let service: PurchasesService;

  beforeEach(() => {
    service = new PurchasesService();
  });

  it('reports itself unavailable when no API key is set', () => {
    expect(service.isAvailable).toBe(false);
  });

  it('configure resolves false rather than throwing', async () => {
    await expect(service.configure('user-123')).resolves.toBe(false);
  });

  it('identify is a silent no-op', async () => {
    await expect(service.identify('user-123')).resolves.toBeUndefined();
  });

  it('identify ignores an empty user id', async () => {
    await expect(service.identify('')).resolves.toBeUndefined();
  });

  it('forgetUser is a silent no-op', async () => {
    await expect(service.forgetUser()).resolves.toBeUndefined();
  });

  it('offers no packages', async () => {
    await expect(service.getPackages()).resolves.toEqual([]);
  });

  it('reports purchasing as unavailable', async () => {
    await expect(service.purchase('premium_monthly')).resolves.toBe('unavailable');
  });

  it('cannot restore', async () => {
    await expect(service.restore()).resolves.toBe(false);
  });
});
