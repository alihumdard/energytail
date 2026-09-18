/**
 * reCAPTCHA v3 token retrieval.
 *
 * v3 is invisible — no puzzle, no checkbox — so this is a function rather than
 * a component: forms ask for a token as they submit.
 *
 * Inert unless NEXT_PUBLIC_CAPTCHA_SITE_KEY is set, matching the backend,
 * which leaves CAPTCHA off until a secret is configured. That keeps local
 * development and the test suite free of live keys.
 */

const SITE_KEY = process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY;

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export function captchaEnabled(): boolean {
  return Boolean(SITE_KEY);
}

let scriptPromise: Promise<void> | null = null;

/** Loads Google's script once, however many forms ask for it. */
function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("CAPTCHA cannot load outside a browser."));
      return;
    }

    if (window.grecaptcha) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the CAPTCHA script."));

    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Returns a token for the given action, or undefined when CAPTCHA is off.
 *
 * Never throws: a failure here would block a sign-in over a third-party
 * script, and the server is the one that decides whether a missing token is
 * acceptable.
 */
export async function getCaptchaToken(action: string): Promise<string | undefined> {
  if (!SITE_KEY) return undefined;

  try {
    await loadScript();

    return await new Promise<string>((resolve, reject) => {
      if (!window.grecaptcha) {
        reject(new Error("CAPTCHA did not initialise."));
        return;
      }

      window.grecaptcha.ready(() => {
        window
          .grecaptcha!.execute(SITE_KEY, { action })
          .then(resolve)
          .catch(reject);
      });
    });
  } catch {
    return undefined;
  }
}
