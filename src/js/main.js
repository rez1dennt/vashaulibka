import { createAppointmentProvider } from './core/appointment-provider.js';
import { initCookieConsent } from './components/cookie-consent.js';
import { initDialog } from './components/dialog.js';
import { initDisclosures } from './components/disclosures.js';
import { initMobileMenu } from './components/mobile-menu.js';
import { initSiteSearch } from './components/site-search.js';
import { initSpecialistsCoverflow } from './components/specialists-coverflow.js';
import { initTabs } from './components/tabs.js';
import { initAccessibilityMode } from './components/accessibility-mode.js';

initMobileMenu();
initSiteSearch();
initDialog({ provider: createAppointmentProvider() });
initDisclosures();
initTabs();
initSpecialistsCoverflow();
initAccessibilityMode();
initCookieConsent();
