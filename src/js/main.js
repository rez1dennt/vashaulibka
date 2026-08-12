import { createAppointmentProvider } from './core/appointment-provider.js';
import { initCookieConsent } from './components/cookie-consent.js';
import { initDialog } from './components/dialog.js';
import { initDisclosures } from './components/disclosures.js';
import { initMobileMenu } from './components/mobile-menu.js';
import { initSpecialistsCoverflow } from './components/specialists-coverflow.js';
import { initTabs } from './components/tabs.js';
import { initVisionMode } from './components/vision-mode.js';

initMobileMenu();
initDialog({ provider: createAppointmentProvider() });
initDisclosures();
initTabs();
initSpecialistsCoverflow();
initVisionMode();
initCookieConsent();
