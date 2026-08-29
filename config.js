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
    /** Production app — signup, login, pricing, and other deep links. */
    appUrl: 'https://joey.ai',

    /** Same-origin base for on-site feature demos (chat, scanner, etc.). */
    demoOrigin: typeof window !== 'undefined' ? window.location.origin.replace(/\/+$/, '') : '',

    /** Deep links into the MeetJoy web app (or on-site demos). */
    paths: {
      signup: '/signup',
      login: '/login',
      pricing: '/pricing',
      chat: '/demo/chat.html',
      checkPet: '/demo/check-pet.html',
      scanner: '/demo/scanner.html',
      dailyWag: '/demo/daily-wag.html',
      fitness: '/demo/daily-wag.html',
      healthFile: '/demo/health-file.html',
      medical: '/demo/health-file.html',
      breedAlerts: '/demo/breed-alerts.html',
      alerts: '/demo/breed-alerts.html',
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

    /**
     * Cinematic homepage intro overlay.
     * Set enabled: false to skip without removing markup.
     */
    intro: {
      enabled: true,
      durationMs: 3000,
    },
  },
  window.JOEY_CONFIG || {}
);
