/**
 * Joey AI marketing site — runtime configuration.
 *
 * Single source of truth for outbound URLs. Mirrors SITE in
 * MeetJoey_be_forntend/lib/constants.ts.
 *
 * Every CTA in the HTML ships with a real href so the page works with
 * JavaScript disabled. This file only *retargets* those links, which is what
 * makes staging deploys possible without editing markup:
 *
 *   window.JOEY_CONFIG = { appUrl: 'https://staging.joey.ai' };
 *
 * Loaded before app.js. Keep it dependency-free and side-effect-free.
 */
window.JOEY_CONFIG = Object.assign(
  {
    /** Where the product lives. All data-cta links are rewritten to it. */
    appUrl: 'https://joey.ai',

    /** Deep links into the app. Paths are resolved against appUrl. */
    paths: {
      signup: '/signup',
      login: '/login',
      pricing: '/pricing',
      chat: '/dashboard/chat',
      scanner: '/dashboard/scanner',
      fitness: '/dashboard/fitness',
      diet: '/dashboard/diet',
      alerts: '/dashboard/alerts',
      medical: '/dashboard/medical',
    },

    /** Support inbox shown in the footer and legal pages. */
    supportEmail: 'support@joey.ai',

    /**
     * Analytics. Both are opt-in: leave empty and nothing is loaded and no
     * third-party request is made. Matches the app's GoogleAnalytics /
     * MicrosoftClarity components, which no-op the same way.
     */
    gaId: '',
    clarityId: '',
  },
  window.JOEY_CONFIG || {}
);
