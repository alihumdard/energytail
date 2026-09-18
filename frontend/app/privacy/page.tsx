import Link from "next/link";
import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What Energy Tail collects, why, and what happens to your data when you apply for a job.",
};

/*
 * Written against what the platform actually does rather than from a
 * template: applications leave the site, CVs sit on a private disk, and job
 * views are recorded once per visitor per day. A privacy policy describing
 * some other system would be worse than none.
 */
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="21 August 2026"
      intro="This explains what Energy Tail collects, why we collect it, and who else sees it. It is written to describe how the site actually works."
    >
      <section>
        <h2>Who we are</h2>
        <p>
          Energy Tail is a job board for the oil, gas and energy industry. We
          list vacancies posted by employers and connect candidates to them. We
          are the data controller for the information described below.
        </p>
      </section>

      <section>
        <h2>What we collect</h2>

        <h3>When you create an account</h3>
        <ul>
          <li>Your name and email address, which are required.</li>
          <li>Your phone number, if you choose to add it.</li>
          <li>
            If you sign in with Google or LinkedIn, the name, email address and
            profile picture that service gives us. We never receive your
            password.
          </li>
        </ul>

        <h3>If you are a candidate</h3>
        <ul>
          <li>Jobs you save, and any private note you attach to them.</li>
          <li>Job alerts you create — the search terms and how often you want emailing.</li>
          <li>
            CVs you upload. These are stored privately and are not published
            anywhere on the site.
          </li>
        </ul>

        <h3>If you are an employer</h3>
        <ul>
          <li>Your company details, which appear on your public company page.</li>
          <li>
            Your company&apos;s contact email and phone, which are kept for our
            records and are <strong>not</strong> published on that page.
          </li>
          <li>
            Billing records. Card details are handled by Stripe and never reach
            our servers — we store only the amount, the outcome and a reference
            to the invoice.
          </li>
        </ul>

        <h3>Automatically</h3>
        <ul>
          <li>
            That a job was viewed. This is counted once per visitor per job per
            day so employers get a meaningful figure rather than a refresh count.
          </li>
          <li>
            That someone clicked through to apply, with the country the request
            came from.
          </li>
          <li>
            Sign-in activity and administrative actions, kept as an audit trail.
          </li>
        </ul>
      </section>

      <section>
        <h2>How applying works</h2>
        <p>
          This is the most important thing to understand about the site.
          Energy Tail does not receive your application. When you click Apply we
          record that the click happened and send you to the employer&apos;s own
          website or email address.
        </p>
        <p>
          Everything after that — your CV, your covering letter, whatever the
          employer asks for — is between you and that employer, and is covered
          by <em>their</em> privacy policy, not this one. We cannot see it,
          cannot retrieve it, and cannot tell you what they did with it.
        </p>
      </section>

      <section>
        <h2>Your CVs</h2>
        <p>
          CVs you upload are stored on private storage. They are not indexed,
          not linked publicly, and not shared with employers. Only you can
          download them, through your own account. Deleting a CV removes the
          file itself, not only the record of it.
        </p>
      </section>

      <section>
        <h2>Who else sees your data</h2>
        <ul>
          <li>
            <strong>Employers</strong> see nothing about you unless you apply
            through their own site, at which point you are dealing with them
            directly.
          </li>
          <li>
            <strong>Stripe</strong> processes payments for employers on paid
            plans and holds the card details we never see.
          </li>
          <li>
            <strong>Our email provider</strong> delivers verification, password
            reset and job alert emails.
          </li>
          <li>
            We do not sell your data, and we do not share it for advertising.
          </li>
        </ul>
      </section>

      <section>
        <h2>Emails we send</h2>
        <p>
          We send account emails you cannot opt out of while you hold an
          account: address verification and password resets. Job alert digests
          are optional — every one carries a link to pause or delete the alert
          that produced it, and you can manage them all from{" "}
          <Link href="/job-alerts" className="text-blue-600 hover:underline">
            your job alerts
          </Link>
          .
        </p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          We use a session cookie to keep you signed in and a token cookie that
          protects forms against cross-site request forgery. Both are necessary
          for the site to work. We do not use advertising or tracking cookies.
        </p>
      </section>

      <section>
        <h2>How long we keep things</h2>
        <ul>
          <li>Account data, for as long as your account exists.</li>
          <li>CVs, until you delete them or close your account.</li>
          <li>
            Billing records, for as long as tax and accounting rules require,
            which is longer than the account itself.
          </li>
          <li>
            View and click counts, which are aggregate figures and are not tied
            to you once recorded.
          </li>
        </ul>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>
          You can see and correct most of your data yourself from{" "}
          <Link href="/profile" className="text-blue-600 hover:underline">
            your profile
          </Link>
          . You may also ask us for a copy of what we hold, ask us to correct
          it, or ask us to delete your account and its data. Write to{" "}
          <a href="mailto:info@energytail.com" className="text-blue-600 hover:underline">
            info@energytail.com
          </a>{" "}
          and we will respond within 30 days.
        </p>
        <p>
          Deleting your account does not reach applications you already sent to
          employers, because we never had them.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          If we change this policy we will update the date at the top. If a
          change materially affects how we use your data we will email account
          holders rather than rely on you noticing.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about this policy go to{" "}
          <a href="mailto:info@energytail.com" className="text-blue-600 hover:underline">
            info@energytail.com
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
