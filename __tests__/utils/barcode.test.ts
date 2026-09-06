import { checkBarcode } from '@/utils/barcode';

describe('deciding whether the camera read a product barcode', () => {
  it('accepts the EAN-13 that started this', () => {
    // The ketchup whose QR code got scanned instead.
    expect(checkBarcode('8595003417709')).toEqual({ ok: true, code: '8595003417709' });
  });

  it.each([
    ['EAN-8', '96385074'],
    ['UPC-A', '036000291452'],
    ['EAN-13', '5901234123457'],
    ['ITF-14', '15901234123457'],
  ])('accepts a real %s', (_label, code) => {
    expect(checkBarcode(code).ok).toBe(true);
  });

  it('trims what the camera hands over', () => {
    expect(checkBarcode('  5901234123457 ')).toEqual({ ok: true, code: '5901234123457' });
  });

  describe('the QR code sitting next to the barcode', () => {
    it.each([
      ['https://www.spak.cz'],
      ['http://example.com/product?id=1'],
      ['www.spak.cz'],
    ])('is recognised as a URL rather than called malformed: %s', (url) => {
      const result = checkBarcode(url);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('looks-like-url');
    });
  });

  it('rejects anything the server would reject, before it is sent', () => {
    const result = checkBarcode('has spaces and , commas');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('wrong-shape');
  });

  it('rejects an empty read', () => {
    expect(checkBarcode('   ').ok).toBe(false);
  });

  it('rejects a digit string of no real barcode length', () => {
    // A partial scan: plausible characters, impossible as a product code.
    const result = checkBarcode('12345');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('implausible-length');
  });

  it('leaves letter-bearing codes alone whatever their length', () => {
    // Internal and store-specific codes are not fixed length, and the server
    // accepts them, so length is only applied to digits-only reads.
    expect(checkBarcode('ABC-123').ok).toBe(true);
  });

  it('rejects a code longer than the server accepts', () => {
    expect(checkBarcode('1'.repeat(51)).reason).toBe('wrong-shape');
  });
});
