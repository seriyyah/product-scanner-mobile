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
        'Optionally, and only if you fill them in: your first and last name, phone number, date of birth, a short bio and a profile picture. None of these are required, the app works without any of them, and you can clear them at any time in Profile.',
        'We do not ask for your address or payment details, and we never see your card.',
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
        'Nobody else.',
        'When we look up a product, we query publicly available product data using the barcode alone. Those sources receive nothing about you, your account or your device.',
      ],
    },
    {
      heading: 'The model is ours',
      body: [
        'The safety rating, the ingredient analysis and the recommendations come from a language model and a set of algorithms we built ourselves. They run on our own servers in Frankfurt.',
        'There is no outside AI service in this app. Nothing you scan is sent to one, because there is not one to send it to.',
        'What the model learns, it learns here, from our own data, to make the app better for the people using it. That learning is not shared and nobody else trains on it.',
        'Product look-ups are made by our servers, never by your phone, so nothing about your device reaches an outside source.',
      ],
    },
    {
      heading: 'Personalised recommendations',
      body: [
        'If you turn on Personalised recommendations in Preferences, we use your scan history to learn what you buy and suggest better alternatives — safer products in the categories you actually shop in.',
        'This shapes what the app recommends to you. It is not used to advertise to you, it is not shared, and it is not sold.',
        'It is off unless you turn it on, and turning it off stops it. We ask separately because it is a different purpose from keeping the app working, and because what you scan can imply things about your health.',
      ],
    },
    {
      heading: 'What we never do',
      body: [
        'We do not sell your personal data. Not your scan history, not your preferences, not to data brokers and not to anyone else.',
        'We do not track you across other companies\u2019 apps or websites, and we do not let anyone track you through us.',
        'We do not show you advertising based on what you scan.',
        'There is no analytics or advertising software of any kind inside this app. No third-party SDK is watching what you do in it.',
        'The only companies that receive anything about you are the two that make the service work: the one that delivers your account emails, and the stores that take your payment. Both are named above, both act only on our instructions, and neither receives your scan history.',
        'We may publish aggregate figures about products — how a category grades on average, for instance. Those are totals with no person in them, and no figure built from fewer than 20 scans is published at all.',
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

/**
 * Open-source and open-data credits.
 *
 * This is the one place the upstream data sources are named, and it is not
 * marketing copy — the Open Database License requires the attribution to travel
 * with the data, so removing this would be a licence breach rather than a
 * tidying-up. It lives on its own screen, reachable from the profile, which is
 * where a reviewer and a licensor both expect to find it and where it tells a
 * casual reader nothing about how the app is built.
 */
export const ATTRIBUTIONS: LegalDocument = {
  title: 'Attributions',
  intro:
    'Product Scanner is built on open data and open source. These are the people whose work makes it possible.',
  sections: [
    {
      heading: 'Open product data',
      body: [
        'Portions of the product information in this app come from Open Food Facts and Open Beauty Facts, community-maintained databases made available under the Open Database License (ODbL) v1.0.',
        'Their contents are contributed by volunteers. We are grateful for it, we correct it where we find it wrong, and any errors in what you see here are ours rather than theirs.',
        'The licence is at opendatacommons.org/licenses/odbl.',
      ],
    },
    {
      heading: 'What is ours',
      body: [
        'The safety ratings, the ingredient and dose analysis, the models and the software are our own work and are not covered by the licences above.',
      ],
    },
    {
      heading: 'Open source',
      body: [
        'This app is built with React Native and Expo, and its backend with FastAPI and PostgreSQL, alongside many other open-source libraries released under permissive licences.',
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
      heading: 'Our own model, and what that means for you',
      body: [
        'The safety ratings are produced by a language model and a set of algorithms we wrote and run ourselves. They are not licensed from anyone and this app is not a wrapper around somebody else\u2019s service.',
        'Everything that reads your data runs on our own servers. There is no outside AI service involved, so nothing you scan is sent to one.',
        'We use what we learn from how the app is used to make it better and more reliable, and to improve the suggestions it gives. That happens here, on our own infrastructure.',
        'The model stays ours. We do not share it, we do not license it out, and nobody else trains on what you scan.',
        'We do not sell your personal data, we do not share it with advertisers or data brokers, and we do not track you across other apps or websites.',
      ],
    },
    {
      heading: 'Where the data comes from',
      body: [
        'Openly available product data, our own research, and what we derive from both. Some of it comes from community-maintained databases licensed under the Open Database License, which we credit in Attributions.',
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
