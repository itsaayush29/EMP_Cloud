import { By } from 'selenium-webdriver';
import { textCaseXpath } from '../../framework/support/locators.js';

/**
 * Onboarding page locators.
 *
 * The onboarding wizard lives at /onboarding and progresses through 5 steps
 * without changing the URL path (it is a SPA step-wizard). Each step has a
 * primary "Continue / Next / Get Started / Finish" button that advances to the
 * next step or completes onboarding.
 *
 * If a step contains required fields that must be filled before advancing,
 * add their locators to the corresponding Step section below and call
 * `safeFill` / `safeClick` / `selectFirstAvailableOption` in
 * `completeOnboardingStep()` inside create-account.spec.js.
 */
export const OnboardingPage = {
  // ─────────────────────────────────────────────────────────────────────────
  // Navigation ─ the primary CTA used to advance through every step.
  // Matches buttons whose visible text contains "continue", "next",
  // "get started", "finish", or "complete" (case-insensitive) that also
  // carry the brand colour or are the page's submit button.
  // ─────────────────────────────────────────────────────────────────────────
  continueButton: By.xpath(
    [
      "//button[",
      "  contains(@class,'bg-brand') or @type='submit'",
      "][",
      "  contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'continue')",
      "  or contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'next')",
      "  or contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'get started')",
      "  or contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'finish')",
      "  or contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'complete')",
      "  or contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'done')",
      "]",
    ].join('')
  ),

  // Fallback: any .bg-brand-600 button (same style as registration submit).
  primaryButton: By.css('button.bg-brand-600, input[type="submit"].bg-brand-600'),

  // ─────────────────────────────────────────────────────────────────────────
  // Step 1 – (fill in field locators once you know the actual field names)
  // ─────────────────────────────────────────────────────────────────────────
  // step1ExampleField: By.name('field_name_here'),

  // ─────────────────────────────────────────────────────────────────────────
  // Step 2
  // ─────────────────────────────────────────────────────────────────────────
  // step2ExampleField: By.name('field_name_here'),

  // ─────────────────────────────────────────────────────────────────────────
  // Step 3
  // ─────────────────────────────────────────────────────────────────────────
  // step3ExampleField: By.name('field_name_here'),

  // ─────────────────────────────────────────────────────────────────────────
  // Step 4
  // ─────────────────────────────────────────────────────────────────────────
  // step4ExampleField: By.name('field_name_here'),

  // ─────────────────────────────────────────────────────────────────────────
  // Step 5 – final step; after clicking Continue here the user lands on the
  // dashboard (or equivalent post-onboarding landing page).
  // ─────────────────────────────────────────────────────────────────────────
  // step5ExampleField: By.name('field_name_here'),

  // ─────────────────────────────────────────────────────────────────────────
  // Completion indicators
  // ─────────────────────────────────────────────────────────────────────────
  // Heading shown on the very last screen / success state (if any).
  completionHeading: By.xpath(
    textCaseXpath('congratulations', 'h1') +
    ' | ' +
    textCaseXpath('all set', 'h1') +
    ' | ' +
    textCaseXpath("you're all set", 'h1') +
    ' | ' +
    textCaseXpath('welcome', 'h1')
  ),
};
