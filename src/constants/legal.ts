/**
 * The terms and the privacy notice, as structured content rather than a blob.
 *
 * App Store Review Guideline 5.1.1(i) requires a privacy policy, and a thin one
 * is the single most common rejection reason — so this describes what the app
 * actually does rather than reciting boilerplate. Every processor named here is
 * one the backend genuinely calls, and the retention periods are the ones the
 * services actually enforce.
 *
 * Two things worth knowing before editing:
 *
 *  - Allergens and dietary restrictions are health data under GDPR Article 9.
 *    They need *explicit* consent, separately from accepting the terms, and the
 *    preferences screen is where that consent is given. Do not fold it into the
 *    signup checkbox.
 *
 *  - Sharing aggregate statistics is lawful only if they are truly anonymous
 *    under Recital 26 — aggregated, with the identifiable originals deleted.
 *    Anything still linkable to a person by a key we hold is pseudonymous, stays
 *    personal data, and may not be shared on this basis.
 *
 * A lawyer should review this before submission. It is written to be accurate,
 * not to be legal advice.
 */

export const LEGAL_LAST_UPDATED = '2026-08-31';
export const LEGAL_CONTACT_EMAIL = 'privacy@product-scanner.app';

export interface LegalSection {
  readonly heading: string;
  readonly body: readonly string[];
}

export interface LegalDocument {
  readonly title: string;
  readonly intro: string;
  readonly sections: readonly LegalSection[];
}

export const PRIVACY_POLICY: LegalDocument = {
  title: 'Privacy Policy',
  intro:
    'This explains what we hold about you, why, and what you can do about it. ' +
    'We have tried to write it in plain language rather than in the language of ' +
    'a document nobody reads.',
  sections: [
    {
      heading: 'What we hold',
      body: [
        'Your email address, and a cryptographic hash of your password — never the password itself.',
        'Your scan history: the barcodes you scanned and when.',
        'Your dietary preferences and declared allergens, if you choose to give them.',
        'Your subscription tier, and a device token if you turn on notifications.',
        'We do not ask for your name, address, phone number or date of birth, and we do not want them.',
      ],
    },
    {
      heading: 'Why we hold it',
      body: [
        'To give you the service you signed up for: scanning products, keeping your history, and rating products for you rather than for everyone.',
        'Allergens and dietary restrictions are health data under GDPR Article 9. We ask for them only so a rating can warn you about something that would harm you, we ask separately and explicitly before you give them, and you can withdraw that at any time in Preferences.',
        'To take payment, which Apple and Google handle — we never see your card.',
      ],
    },
    {
      heading: 'Where it lives',
      body: [
        'On servers in Frankfurt, Germany, inside the European Union. Your personal data is not transferred outside the EU.',
        'The AI that explains a rating runs on that same server. It is not a third-party service, and nothing you scan is sent to one.',
      ],
    },
    {
      heading: 'Who else sees it',
      body: [
        'Apple and Google, for subscription payments, through RevenueCat. They are the merchant of record.',
        'Resend, which sends the account emails — verification and password resets.',
        'Nobody else. We do not sell your personal data, and we do not share it with advertisers or data brokers.',
        'We look products up in Open Food Facts and Open Beauty Facts. We send them a barcode. We do not send them anything about you.',
      ],
    },
    {
      heading: 'Statistics we may publish',
      body: [
        'We may publish aggregate figures — for example, how many scanned products in a category carry a given grade.',
        'These are group statistics only, with the individual records that produced them deleted, so no person can be identified from them or re-identified afterwards. Under GDPR Recital 26 such genuinely anonymous information is no longer personal data.',
        'This never includes anything about an individual, and never includes your scan history.',
      ],
    },
    {
      heading: 'How long we keep it',
      body: [
        'Scan history: 30 days on the free tier, 2 years on a paid tier, then deleted automatically.',
        'Your account and preferences: until you delete your account.',
        'Payment records: retained after deletion, without you attached to them, because tax law and the app stores require it.',
      ],
    },
    {
      heading: 'What you can do',
      body: [
        'See everything we hold about you, and take it with you as a file — Profile, then Export My Data.',
        'Delete your account and everything personal in it, from inside the app — Profile, then Delete Account. It is immediate and it is not reversible.',
        'Correct anything wrong, withdraw consent for allergen data, or object to how we use it.',
        'Complain to your data protection authority. In the Czech Republic that is the Úřad pro ochranu osobních údajů.',
      ],
    },
    {
      heading: 'Children',
      body: [
        'The app is not intended for children under 16, and we do not knowingly hold data about them.',
      ],
    },
    {
      heading: 'Contact',
      body: [
        `Write to ${LEGAL_CONTACT_EMAIL} about anything in this notice.`,
      ],
    },
  ],
};

export const TERMS_OF_SERVICE: LegalDocument = {
  title: 'Terms of Service',
  intro:
    'The agreement between you and us. The short version: use the app, do not ' +
    'abuse it, and do not treat a rating as medical advice.',
  sections: [
    {
      heading: 'What this app does',
      body: [
        'It reads a barcode, looks the product up, and rates it for safety using our own model.',
        'Ratings are computed from published data: nutrition and processing classifications, declared ingredients, and evidence about specific substances. We show you what drove each rating.',
      ],
    },
    {
      heading: 'What a rating is, and is not',
      body: [
        'It is our assessment from the data available to us. It is not medical, dietary or nutritional advice, and it is not a substitute for reading the label.',
        'If you have an allergy or a medical condition, the pack in your hand is the authority — not us. Product formulations change, and public databases lag behind them.',
        'Where we do not have enough information, we say so and show no grade, rather than guessing.',
      ],
    },
    {
      heading: 'Where the data comes from',
      body: [
        'Open Food Facts and Open Beauty Facts, which are community-maintained and licensed under the Open Database License, and public sources we search when a product is in neither.',
        'We may be wrong because a source is wrong. If you find a mistake, tell us and we will fix it.',
      ],
    },
    {
      heading: 'Your account',
      body: [
        'One account per person. Keep your password to yourself.',
        'Do not use automated tools to scrape the service, and do not attempt to overwhelm it.',
        'You can delete your account at any time from inside the app.',
      ],
    },
    {
      heading: 'Subscriptions',
      body: [
        'Paid tiers are sold through the App Store and Google Play. They handle the payment, the price in your currency, and the tax.',
        'Subscriptions renew until cancelled. Cancel through your Apple or Google account settings — we cannot cancel it for you.',
        'Refunds are handled by the store under its own policy.',
      ],
    },
    {
      heading: 'Limits',
      body: [
        'The service is provided as it is. We work to keep it accurate and available, but we do not guarantee either.',
        'We are not liable for decisions you make based on a rating. See what a rating is, above.',
      ],
    },
    {
      heading: 'Changes',
      body: [
        'We may change these terms. If a change matters, we will tell you in the app before it takes effect.',
        `Last updated ${LEGAL_LAST_UPDATED}.`,
      ],
    },
  ],
};
