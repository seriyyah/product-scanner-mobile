/**
 * Deciding whether something the camera read is a product barcode.
 *
 * Packaging carries more than one code. The Czech ketchup that exposed this has
 * a QR code next to the EAN pointing at the manufacturer's website, and the
 * camera happily read that first — so the app sent a URL to an endpoint that
 * accepts `^[0-9A-Za-z-]{1,50}$`, and the user was shown that regex.
 *
 * Two things follow. The scanner should not be looking for QR codes at all, and
 * whatever it does read should be checked here, where the answer can be a
 * sentence a person understands, rather than at the API boundary where the
 * answer is a pattern.
 */

/** Mirrors the scanner service's own rule, deliberately. */
const SERVER_PATTERN = /^[0-9A-Za-z-]{1,50}$/;

/** Real retail barcodes: EAN-8, UPC-E, UPC-A, EAN-13, ITF-14. */
const PLAUSIBLE_LENGTHS = new Set([8, 12, 13, 14]);

export type BarcodeRejection = 'looks-like-url' | 'wrong-shape' | 'implausible-length';

export interface BarcodeCheck {
  readonly ok: boolean;
  readonly code: string;
  readonly reason?: BarcodeRejection;
}

/**
 * Whether this string should be sent to the scanner API.
 *
 * Rejecting here is not about trusting the server less — the server still
 * validates. It is about being able to say "that is a website address, not a
 * barcode" instead of showing someone a regular expression.
 */
export function checkBarcode(raw: string): BarcodeCheck {
  const code = (raw ?? '').trim();

  // Checked before shape so the message can name what actually happened: a QR
  // code on packaging is nearly always a marketing URL, and that is worth
  // saying rather than calling it malformed.
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(code) || /^www\./i.test(code)) {
    return { ok: false, code, reason: 'looks-like-url' };
  }

  if (!SERVER_PATTERN.test(code)) {
    return { ok: false, code, reason: 'wrong-shape' };
  }

  // Digits-only but the wrong length is a misread rather than a real code —
  // usually a partial scan. Anything containing letters is left alone, since
  // internal and store-specific codes are not fixed length.
  if (/^\d+$/.test(code) && !PLAUSIBLE_LENGTHS.has(code.length)) {
    return { ok: false, code, reason: 'implausible-length' };
  }

  return { ok: true, code };
}
