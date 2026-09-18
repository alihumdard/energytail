import Link from "next/link";
import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The rules for using Energy Tail as a candidate, an employer or an author.",
};

/*
 * Describes the rules the platform actually enforces — the review gate on
 * articles, the posting limits on plans, cancellation at period end — rather
 * than boilerplate that contradicts the code.
 */
export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      updated="21 August 2026"
      intro="These are the rules for using Energy Tail. By creating an account you agree to them."
    >
      <section>
        <h2>The service</h2>
        <p>
          Energy Tail is a job board for the oil, gas and energy industry. We
          publish vacancies posted by employers and let candidates search them.
          We are not a recruitment agency, not an employer, and not a party to
          anything that happens between you and a company you find here.
        </p>
      </section>

      <section>
        <h2>Your account</h2>
        <ul>
          <li>You must be 16 or older and give accurate information.</li>
          <li>You are responsible for what happens under your account.</li>
          <li>One account per person. Accounts are not transferable.</li>
          <li>
            We may suspend an account that breaks these terms, and we will say
            why when we do.
          </li>
        </ul>
      </section>

      <section>
        <h2>For candidates</h2>
        <p>
          Searching, saving jobs and setting alerts are free. When you apply we
          send you to the employer&apos;s own site or inbox — your application
          goes to them, not to us.
        </p>
        <p>
          That means we cannot tell you whether an employer read your
          application, cannot chase them, and cannot show you its progress. Any
          status you keep is your own record.
        </p>
        <p>
          We do not guarantee that any listing is current, accurate or genuine.
          Employers write their own listings. Tell us at{" "}
          <a href="mailto:info@energytail.com" className="text-blue-600 hover:underline">
            info@energytail.com
          </a>{" "}
          if you find one that is not.
        </p>
      </section>

      <section>
        <h2>For employers</h2>

        <h3>Listings</h3>
        <ul>
          <li>
            Post only genuine vacancies you are hiring for. No adverts for
            training, no pay-to-apply schemes, no listings that exist to
            collect CVs.
          </li>
          <li>
            A listing must be lawful and must not discriminate on grounds
            protected by the law where the role is based.
          </li>
          <li>
            Post under your own company. Posting on behalf of another business
            without its authority is a breach of these terms.
          </li>
          <li>
            We may remove a listing that breaks these rules. We record the
            reason, and you can ask us for it.
          </li>
        </ul>

        <h3>Plans and payment</h3>
        <ul>
          <li>
            Each plan includes a number of job postings per billing period, set
            out on the{" "}
            <Link href="/pricing" className="text-blue-600 hover:underline">
              pricing page
            </Link>
            . A posting is counted when the job is created, whether or not you
            later delete it.
          </li>
          <li>
            Unused postings do not carry over into the next period.
          </li>
          <li>
            Subscriptions renew automatically until cancelled. Cancelling stops
            the next renewal — your plan continues to the end of the period you
            have already paid for.
          </li>
          <li>
            If a payment fails we do not remove your listings immediately. The
            card is retried, and we will email you.
          </li>
          <li>
            Featured placement is sold by us and set by us. It is not something
            a listing can claim for itself.
          </li>
        </ul>
      </section>

      <section>
        <h2>For authors</h2>
        <p>
          Articles are reviewed by an editor before they are published. An
          editor may publish a piece, or send it back with a note explaining
          what needs to change.
        </p>
        <p>
          Once an article is published it can only be changed by an editor —
          this is deliberate, so an approved piece cannot be rewritten after the
          fact. You keep the copyright in what you write and grant us a licence
          to publish it on Energy Tail.
        </p>
        <p>
          Submit only work that is yours. Plagiarism, undisclosed paid
          promotion and content written to place links are all grounds for
          removal.
        </p>
      </section>

      <section>
        <h2>Things you must not do</h2>
        <ul>
          <li>Scrape, harvest or bulk-copy listings, companies or user data.</li>
          <li>
            Attempt to access another account, another company&apos;s data, or
            any part of the system you have not been given access to.
          </li>
          <li>Upload anything containing malware.</li>
          <li>
            Use the site to send unsolicited commercial messages to anyone you
            find on it.
          </li>
          <li>Interfere with the site&apos;s operation or security.</li>
        </ul>
      </section>

      <section>
        <h2>Content you post</h2>
        <p>
          You keep ownership of what you upload. You grant us the licence we
          need to display it on the site and in search results. You are
          responsible for having the right to post it.
        </p>
      </section>

      <section>
        <h2>Availability</h2>
        <p>
          We work to keep the site running but do not promise uninterrupted
          service. We may change or withdraw features. Where a change materially
          affects a paid plan we will tell subscribers in advance.
        </p>
      </section>

      <section>
        <h2>Liability</h2>
        <p>
          Energy Tail is provided as it is. We are not liable for hiring
          decisions, for the conduct of employers or candidates, for the
          accuracy of listings, or for losses arising from your use of the site,
          to the extent the law allows us to exclude that liability.
        </p>
        <p>Nothing here limits liability that cannot lawfully be limited.</p>
      </section>

      <section>
        <h2>Ending your account</h2>
        <p>
          You may close your account at any time by writing to{" "}
          <a href="mailto:info@energytail.com" className="text-blue-600 hover:underline">
            info@energytail.com
          </a>
          . We may close an account that breaks these terms. Paid periods
          already served are not refunded on closure for breach.
        </p>
      </section>

      <section>
        <h2>Changes to these terms</h2>
        <p>
          We may update these terms. The date at the top shows when they last
          changed, and we will email account holders about changes that
          materially affect them.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions go to{" "}
          <a href="mailto:info@energytail.com" className="text-blue-600 hover:underline">
            info@energytail.com
          </a>
          . Our{" "}
          <Link href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </Link>{" "}
          explains what we do with your data.
        </p>
      </section>
    </LegalPage>
  );
}
