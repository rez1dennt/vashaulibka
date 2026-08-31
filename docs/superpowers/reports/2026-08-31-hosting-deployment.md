# Hosting deployment — stomdemidov.ru

## Published scope

- Deployed the production build to the clinic's existing SSH hosting, in the confirmed document root for `stomdemidov.ru`.
- Uploaded only the 64 public build files. Source code, dependencies, Git metadata, credentials and deployment archives are outside the web root.
- Preserved the existing hosting placeholder as `site-backups/stomdemidov-before-20260831-52ff992.tar.gz` under the hosting account's private data directory.
- Uploaded the main release archive and a small domain-metadata update. SHA-256 values matched before extraction; an rsync checksum comparison after copying reported no differences.
- The supplied domain is the single source for canonical URLs, Open Graph URL, Dentist structured-data URL, sitemap, robots and the website address in the privacy policy (`src/data/site.js`).

## HTTPS

- Replaced the self-signed active certificate with a free Let's Encrypt certificate through the hosting panel.
- Verified the certificate using normal TLS validation, without ignoring certificate errors. Observed issuer: Let's Encrypt YR2; expiry: 29 November 2026.
- Enabled HTTP-to-HTTPS redirection and the `www`-to-apex domain redirect. The hosting panel currently implements the www redirect through an intermediate HTTP redirect followed by HTTPS; the final destination is the protected apex domain.
- Existing logging, PHP and caching policies were preserved. No SMS settings or paid hosting services were changed.

## Checks

- `pnpm verify`: 50 test files, 530 tests passed; production build succeeded; 20 HTML pages passed structural/link verification.
- All 64 deployed files returned HTTP 200 with sizes matching the build. One AVIF request timed out during a parallel check and passed a separate retry; PDF responses have `application/pdf` content type.
- `/.git/config` returns 403; `/package.json` and `/site-backups/` return 404.
- Live search for “Рощина” returned the specialist and navigated to `specialists.html#specialist-3`.
- Production browser matrix: all 20 routes at 1280, 768, 360 and 320 px (80 checks), with no horizontal overflow, broken loaded image, missing/duplicate H1 or incorrect canonical domain. The removed regulation 736 card remained absent.
- Cookie notice appeared on first visit. Rejecting optional storage kept the MIS script/frame unloaded. Granting online-booking permission allowed the 32top form to open on the production domain.
- At 320 px, the MIS frame fitted within the viewport; body scrolling was hidden while open and restored after close. Mobile navigation opened/closed, and the accessibility toolbar could be enabled and returned to the normal site version.
- No patient details were entered, no appointment was submitted, and no SMS was sent as part of testing.

The deployment check does not certify legal compliance or externally controlled MIS tariffs. Outstanding clinic/legal inputs remain in `CONTENT_CHECKLIST.md`.
