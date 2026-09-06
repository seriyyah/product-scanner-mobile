/**
 * Opening the product a "ready" notification is about.
 *
 * A tap that lands on the home screen wastes the notification: the person was
 * told a specific product finished, and then has to go and find it. The barcode
 * rides along in the notification payload precisely so the tap can land on it.
 *
 * The decision of *whether* this notification is one of ours is pulled out as a
 * plain function so it can be tested without a navigator, a notification
 * service, or a device — none of which exist in a unit test, and all of which
 * would otherwise have to be faked to check a single `if`.
 */

/** The payload our backend attaches to a product-ready push. */
export interface ProductReadyData {
  readonly type?: unknown;
  readonly barcode?: unknown;
}

/**
 * The barcode to open for a notification, or null when it is not ours.
 *
 * Deliberately strict about both fields. Notification payloads arrive from
 * outside the app and are not typed at runtime, and navigating to
 * ProductDetail with a non-string barcode would crash the screen rather than
 * fail quietly.
 */
export function productBarcodeFromNotification(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const { type, barcode } = data as ProductReadyData;
  if (type !== 'product_ready') return null;
  if (typeof barcode !== 'string') return null;
  const trimmed = barcode.trim();
  return trimmed.length > 0 ? trimmed : null;
}
