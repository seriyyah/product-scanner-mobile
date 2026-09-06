import { productBarcodeFromNotification } from '@/utils/productReadyNotification';

describe('deciding where a tapped notification should land', () => {
  it('opens the product a product-ready notification names', () => {
    expect(
      productBarcodeFromNotification({ type: 'product_ready', barcode: '5901234123457' }),
    ).toBe('5901234123457');
  });

  it('ignores notifications that are not about a finished product', () => {
    expect(
      productBarcodeFromNotification({ type: 'promo', barcode: '5901234123457' }),
    ).toBeNull();
  });

  it('ignores a product-ready notification with no barcode to open', () => {
    expect(productBarcodeFromNotification({ type: 'product_ready' })).toBeNull();
  });

  // The payload crosses a network and an OS before it reaches us, and nothing
  // in between enforces a shape. Navigating with a non-string barcode would
  // crash ProductDetail rather than fail quietly.
  it.each([
    ['a number', { type: 'product_ready', barcode: 5901234123457 }],
    ['an object', { type: 'product_ready', barcode: { code: '123' } }],
    ['null', { type: 'product_ready', barcode: null }],
    ['blank', { type: 'product_ready', barcode: '   ' }],
  ])('refuses a barcode that is %s', (_label, payload) => {
    expect(productBarcodeFromNotification(payload)).toBeNull();
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a string', 'product_ready'],
    ['a number', 7],
  ])('survives a payload that is %s', (_label, payload) => {
    expect(productBarcodeFromNotification(payload)).toBeNull();
  });

  it('trims a barcode that arrived padded', () => {
    expect(
      productBarcodeFromNotification({ type: 'product_ready', barcode: ' 123 ' }),
    ).toBe('123');
  });
});
