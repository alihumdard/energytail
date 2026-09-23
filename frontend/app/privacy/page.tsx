import Link from "next/link";
import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Energy Tail collects, uses, discloses, stores, and protects personal information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="21 September 2026"
      intro={
        'Energy Tail ("Energy Tail", "we", "us", or "our") respects your privacy and is committed to protecting personal information. This Privacy Policy explains how we collect, use, disclose, store, and protect personal information when you visit or use www.energytail.com and related Energy Tail services (collectively, the "Platform"). By using the Platform, you acknowledge the practices described in this Privacy Policy.'
      }
    >
      <section>
        <h2>1. Who We Are</h2>
        <p>
          Energy Tail operates an online employment platform serving
          professionals and employers in the oil, gas, energy, renewable
          energy, petrochemical, power, LNG, offshore, and related
          industries.
        </p>
        <p>
          For personal information that Energy Tail controls, Energy Tail
          acts as the relevant data controller or equivalent responsible
          entity, subject to applicable privacy laws.
        </p>
        <p>
          Contact:{" "}
          <a href="mailto:info.energytail@gmail.com" className="text-blue-600 hover:underline">
            info.energytail@gmail.com
          </a>
        </p>
      </section>

      <section>
        <h2>2. Information We Collect</h2>
        <p>
          We may collect different categories of information depending on
          how you use Energy Tail.
        </p>

        <h3>2.1 Account information</h3>
        <p>When you create an account, we may collect:</p>
        <ul>
          <li>first name;</li>
          <li>last name;</li>
          <li>email address;</li>
          <li>password information;</li>
          <li>account type;</li>
          <li>phone number, if provided;</li>
          <li>profile information;</li>
          <li>professional information; and</li>
          <li>other information you choose to provide.</li>
        </ul>
        <p>
          We do not need to receive or store your password when you
          authenticate through a third-party login provider such as Google
          or LinkedIn.
        </p>

        <h3>2.2 Job seeker information</h3>
        <p>If you use Energy Tail as a job seeker, we may collect:</p>
        <ul>
          <li>CVs and resumes;</li>
          <li>employment history;</li>
          <li>education;</li>
          <li>skills;</li>
          <li>certifications;</li>
          <li>professional qualifications;</li>
          <li>job preferences;</li>
          <li>saved jobs;</li>
          <li>job-alert preferences;</li>
          <li>private notes;</li>
          <li>profile information; and</li>
          <li>other professional information you voluntarily provide.</li>
        </ul>
        <p>
          You should avoid including sensitive personal information in a CV
          unless it is genuinely necessary for your employment purposes.
        </p>

        <h3>2.3 Employer information</h3>
        <p>If you use Energy Tail as an employer, we may collect:</p>
        <ul>
          <li>name and contact information;</li>
          <li>company name;</li>
          <li>company description;</li>
          <li>company website;</li>
          <li>company profile information;</li>
          <li>job vacancy information;</li>
          <li>business contact information;</li>
          <li>account information;</li>
          <li>billing and subscription information; and</li>
          <li>communications with Energy Tail.</li>
        </ul>
        <p>Some company information may be publicly displayed on the Platform.</p>

        <h3>2.4 Information from social login providers</h3>
        <p>
          If you register or sign in using Google, LinkedIn, or another
          supported third-party authentication service, we may receive
          information that the provider makes available to us, such as:
        </p>
        <ul>
          <li>name;</li>
          <li>email address;</li>
          <li>profile image; and</li>
          <li>authentication identifiers.</li>
        </ul>
        <p>We do not receive your third-party account password.</p>
        <p>
          Your use of the third-party service is also subject to that
          provider&apos;s privacy policy.
        </p>

        <h3>2.5 Application and job interaction information</h3>
        <p>
          When you interact with job listings, we may collect information
          such as:
        </p>
        <ul>
          <li>jobs viewed;</li>
          <li>jobs saved;</li>
          <li>application-link clicks;</li>
          <li>approximate country associated with an application click;</li>
          <li>date and time of interactions; and</li>
          <li>related technical information.</li>
        </ul>
        <p>
          Unless explicitly stated otherwise, clicking an external
          &quot;Apply&quot; button does not cause your CV or application to
          be sent to Energy Tail.
        </p>

        <h3>2.6 Payment information</h3>
        <p>Employers may purchase paid services through Energy Tail.</p>
        <p>
          Payments may be processed by third-party payment providers such as
          Stripe.
        </p>
        <p>
          Where payment processing is handled by a third party, payment-card
          information may be transmitted directly to that provider rather
          than stored on Energy Tail&apos;s servers.
        </p>
        <p>Energy Tail may receive and retain information such as:</p>
        <ul>
          <li>transaction amount;</li>
          <li>payment status;</li>
          <li>invoice information;</li>
          <li>subscription information; and</li>
          <li>payment or transaction reference numbers.</li>
        </ul>

        <h3>2.7 Technical information</h3>
        <p>
          When you use the Platform, we may automatically collect technical
          information, including:
        </p>
        <ul>
          <li>IP address;</li>
          <li>browser type;</li>
          <li>device type;</li>
          <li>operating system;</li>
          <li>pages visited;</li>
          <li>referring pages;</li>
          <li>date and time of access;</li>
          <li>session information;</li>
          <li>security and authentication information; and</li>
          <li>other technical information necessary to operate and secure the Platform.</li>
        </ul>

        <h3>2.8 Cookies and similar technologies</h3>
        <p>Energy Tail may use cookies and similar technologies to:</p>
        <ul>
          <li>keep you signed in;</li>
          <li>maintain sessions;</li>
          <li>protect forms and accounts;</li>
          <li>maintain security;</li>
          <li>remember preferences; and</li>
          <li>understand basic Platform usage.</li>
        </ul>
        <p>
          Where applicable, non-essential cookies or similar technologies
          will be handled in accordance with applicable law and available
          consent mechanisms.
        </p>
      </section>

      <section>
        <h2>3. How We Use Personal Information</h2>
        <p>We may use personal information to:</p>
        <ul>
          <li>create and manage accounts;</li>
          <li>authenticate users;</li>
          <li>provide job-search functionality;</li>
          <li>display employer and company profiles;</li>
          <li>process job postings;</li>
          <li>provide job alerts;</li>
          <li>store saved jobs;</li>
          <li>provide CV storage;</li>
          <li>process payments;</li>
          <li>provide customer support;</li>
          <li>communicate with users;</li>
          <li>send account-related emails;</li>
          <li>send job alerts and other requested communications;</li>
          <li>detect fraud and abuse;</li>
          <li>protect Platform security;</li>
          <li>maintain audit and security logs;</li>
          <li>analyze and improve the Platform;</li>
          <li>develop new services;</li>
          <li>comply with legal obligations; and</li>
          <li>enforce our Terms and other policies.</li>
        </ul>
      </section>

      <section>
        <h2>4. Legal Bases for Processing</h2>
        <p>
          Where privacy laws such as the GDPR or similar legislation apply,
          we may process personal information based on one or more of the
          following legal bases:
        </p>
        <ul>
          <li>performance of a contract;</li>
          <li>taking steps at your request before entering into a contract;</li>
          <li>compliance with legal obligations;</li>
          <li>legitimate interests, where permitted;</li>
          <li>consent; and</li>
          <li>protection of vital interests or other lawful bases recognized by applicable law.</li>
        </ul>
        <p>
          Where processing is based on consent, you may withdraw consent
          subject to applicable legal limitations.
        </p>
      </section>

      <section>
        <h2>5. How Job Applications Work</h2>
        <p>Energy Tail is primarily a job-discovery platform.</p>
        <p>
          When you select an application link that takes you to an
          employer&apos;s website, application system, or email address, the
          employer may directly receive the information you provide there.
        </p>
        <p>
          Energy Tail generally does not receive the application, CV, cover
          letter, or other information you submit directly to that employer.
        </p>
        <p>
          The employer becomes responsible for its own handling of your
          information, subject to the employer&apos;s applicable privacy
          policy and legal obligations.
        </p>
      </section>

      <section>
        <h2>6. CV Storage</h2>
        <p>Where Energy Tail allows candidates to upload CVs:</p>
        <ul>
          <li>CVs may be stored on secure infrastructure;</li>
          <li>CVs are not necessarily publicly accessible;</li>
          <li>
            access may be restricted to the relevant account and authorized
            Platform functionality;
          </li>
          <li>you may be able to delete your CV through your account;</li>
          <li>
            deletion may not immediately remove copies required to be
            retained for security, legal, or backup purposes; and
          </li>
          <li>we may retain limited information where legally necessary.</li>
        </ul>
        <p>
          The exact visibility of a CV depends on the functionality
          associated with your account and the Platform at the time of use.
        </p>
      </section>

      <section>
        <h2>7. Who We Share Information With</h2>
        <p>
          We may share personal information with selected third parties
          where necessary to operate the Platform. These may include:
        </p>

        <h3>Service providers</h3>
        <p>Technology and service providers that help us operate:</p>
        <ul>
          <li>hosting;</li>
          <li>databases;</li>
          <li>cloud storage;</li>
          <li>email delivery;</li>
          <li>authentication;</li>
          <li>analytics;</li>
          <li>security;</li>
          <li>customer support; and</li>
          <li>payment processing.</li>
        </ul>

        <h3>Payment providers</h3>
        <p>
          Payment providers may process payment information for employer
          subscriptions and other paid services.
        </p>

        <h3>Authentication providers</h3>
        <p>
          If you choose Google, LinkedIn, or another supported authentication
          option, information may be exchanged with that provider as
          necessary to authenticate your account.
        </p>

        <h3>Employers</h3>
        <p>
          We may provide information to employers where the Platform
          functionality expressly allows this.
        </p>
        <p>
          However, where you independently submit an application through an
          employer&apos;s external website or application system, the
          employer receives the information you submit directly to it.
        </p>

        <h3>Legal and regulatory authorities</h3>
        <p>We may disclose information where reasonably necessary to:</p>
        <ul>
          <li>comply with law;</li>
          <li>respond to lawful requests;</li>
          <li>protect our rights;</li>
          <li>investigate fraud or abuse;</li>
          <li>protect users or the public; or</li>
          <li>enforce our agreements.</li>
        </ul>

        <h3>Business transfers</h3>
        <p>
          If Energy Tail is involved in a merger, acquisition, financing,
          restructuring, sale of assets, or similar transaction, personal
          information may be transferred as part of that transaction,
          subject to applicable law.
        </p>
      </section>

      <section>
        <h2>8. We Do Not Sell Personal Information</h2>
        <p>
          Energy Tail does not sell personal information in the ordinary
          meaning of selling personal data for money.
        </p>
        <p>
          We also do not permit personal information to be used for purposes
          that are inconsistent with this Privacy Policy without an
          appropriate legal basis or notice where required by law.
        </p>
        <p>
          If applicable law gives you a right to opt out of a particular
          category of data sharing or &quot;sale&quot; as legally defined, we
          will honor applicable requirements.
        </p>
      </section>

      <section>
        <h2>9. Marketing and Communications</h2>
        <p>We may send:</p>
        <ul>
          <li>account verification messages;</li>
          <li>password-reset messages;</li>
          <li>security notifications;</li>
          <li>service-related communications;</li>
          <li>job alerts you request; and</li>
          <li>other communications permitted by law.</li>
        </ul>
        <p>
          You may generally unsubscribe from optional marketing or job-alert
          communications using the unsubscribe or preference controls
          provided in the relevant message.
        </p>
        <p>
          Certain essential service communications cannot be disabled while
          you maintain an account.
        </p>
      </section>

      <section>
        <h2>10. Data Retention</h2>
        <p>
          We retain personal information only for as long as reasonably
          necessary for the purposes described in this Privacy Policy,
          including to:
        </p>
        <ul>
          <li>provide the Platform;</li>
          <li>maintain accounts;</li>
          <li>fulfill contractual obligations;</li>
          <li>comply with legal requirements;</li>
          <li>resolve disputes;</li>
          <li>prevent fraud;</li>
          <li>maintain security; and</li>
          <li>enforce agreements.</li>
        </ul>
        <p>
          Retention periods may vary depending on the type of information and
          applicable legal requirements. For example:
        </p>
        <ul>
          <li>account information may be retained while your account remains active;</li>
          <li>
            CVs may be retained until you delete them or close your account,
            subject to necessary backups and legal requirements;
          </li>
          <li>billing and accounting records may be retained for legally required periods; and</li>
          <li>
            security and audit information may be retained for periods
            reasonably necessary for security and compliance.
          </li>
        </ul>
      </section>

      <section>
        <h2>11. Data Security</h2>
        <p>
          We use reasonable technical and organizational measures designed to
          protect personal information against unauthorized access, loss,
          misuse, alteration, or disclosure.
        </p>
        <p>
          However, no internet transmission or storage system can be
          guaranteed to be completely secure.
        </p>
        <p>
          You are responsible for protecting your account credentials and
          should notify us promptly if you believe your account has been
          compromised.
        </p>
      </section>

      <section>
        <h2>12. International Data Transfers</h2>
        <p>
          Energy Tail and its service providers may operate in, or process
          information from, countries other than the country where you live.
        </p>
        <p>As a result, your information may be transferred internationally.</p>
        <p>
          Where applicable law requires safeguards for international
          transfers, we will seek to use legally recognized mechanisms such
          as appropriate contractual safeguards or other permitted transfer
          mechanisms.
        </p>
      </section>

      <section>
        <h2>13. Your Privacy Rights</h2>
        <p>
          Depending on your location and applicable law, you may have rights
          including:
        </p>
        <ul>
          <li>access to personal information;</li>
          <li>correction of inaccurate information;</li>
          <li>deletion of personal information;</li>
          <li>restriction of certain processing;</li>
          <li>objection to certain processing;</li>
          <li>data portability;</li>
          <li>withdrawal of consent where processing is based on consent;</li>
          <li>opting out of certain marketing communications; and</li>
          <li>lodging a complaint with a relevant data protection authority.</li>
        </ul>
        <p>
          To exercise applicable rights, contact{" "}
          <a href="mailto:info.energytail@gmail.com" className="text-blue-600 hover:underline">
            info.energytail@gmail.com
          </a>
          .
        </p>
        <p>We may need to verify your identity before fulfilling a request.</p>
        <p>We will respond within the period required by applicable law.</p>
      </section>

      <section>
        <h2>14. Account Deletion</h2>
        <p>
          You may request deletion of your Energy Tail account by contacting
          us at{" "}
          <a href="mailto:info.energytail@gmail.com" className="text-blue-600 hover:underline">
            info.energytail@gmail.com
          </a>{" "}
          or using available account controls.
        </p>
        <p>Deleting your Energy Tail account does not necessarily delete information held by:</p>
        <ul>
          <li>employers to whom you previously submitted an application;</li>
          <li>third-party authentication providers;</li>
          <li>payment providers; or</li>
          <li>other independent third parties.</li>
        </ul>
        <p>We cannot delete information that we do not control.</p>
        <p>We may also retain certain information where required or permitted by law.</p>
      </section>

      <section>
        <h2>15. Children&apos;s Privacy</h2>
        <p>
          Energy Tail is not intended for children below the minimum age
          permitted by our Terms or applicable law.
        </p>
        <p>
          We do not knowingly collect personal information from children
          where such collection is prohibited by applicable law.
        </p>
        <p>
          If you believe a child has provided personal information to us in
          violation of applicable requirements, contact us so that we can
          investigate and take appropriate action.
        </p>
      </section>

      <section>
        <h2>16. Third-Party Links</h2>
        <p>
          The Platform may contain links to third-party websites, including
          employer websites, application systems, social networks, payment
          services, and other resources.
        </p>
        <p>
          We are not responsible for the privacy practices or content of
          third-party websites.
        </p>
        <p>
          You should review the privacy policy of each third-party service
          before submitting personal information.
        </p>
      </section>

      <section>
        <h2>17. User-Generated Content</h2>
        <p>
          Information that you choose to publish publicly, such as certain
          employer company information, job listings, articles, or profile
          information, may be visible to other Platform users or members of
          the public.
        </p>
        <p>Do not publish personal information that you do not want to make publicly accessible.</p>
      </section>

      <section>
        <h2>18. Fraud, Security and Abuse Prevention</h2>
        <p>We may process information to detect and prevent:</p>
        <ul>
          <li>fraudulent accounts;</li>
          <li>fake job listings;</li>
          <li>scams;</li>
          <li>unauthorized access;</li>
          <li>abuse;</li>
          <li>malicious activity;</li>
          <li>security incidents; and</li>
          <li>violations of our Terms.</li>
        </ul>
        <p>
          This may include analyzing account activity, technical information,
          login activity, and other relevant information.
        </p>
      </section>

      <section>
        <h2>19. Changes to This Privacy Policy</h2>
        <p>We may update this Privacy Policy periodically.</p>
        <p>
          The &quot;Last Updated&quot; date at the beginning of the policy
          will identify the latest version.
        </p>
        <p>
          If a change materially affects how we process personal
          information, we may provide additional notice where required by
          law.
        </p>
      </section>

      <section>
        <h2>20. Contact Us</h2>
        <p>
          For questions, privacy requests, complaints, or requests concerning
          your personal information:
        </p>
        <p>
          Energy Tail
          <br />
          Email:{" "}
          <a href="mailto:info.energytail@gmail.com" className="text-blue-600 hover:underline">
            info.energytail@gmail.com
          </a>
          <br />
          Website:{" "}
          <a href="https://www.energytail.com/" className="text-blue-600 hover:underline">
            https://www.energytail.com/
          </a>
        </p>
        <p>
          When contacting us about a privacy request, please provide enough
          information for us to identify your account and understand your
          request.
        </p>
      </section>

      <section>
        <h2>21. Important Jurisdiction-Specific Rights</h2>
        <p>Energy Tail may be accessed by users in multiple countries.</p>
        <p>
          Additional privacy rights may apply depending on your location,
          including rights under:
        </p>
        <ul>
          <li>the EU General Data Protection Regulation (GDPR);</li>
          <li>the UK GDPR and UK Data Protection Act;</li>
          <li>applicable U.S. state privacy laws;</li>
          <li>applicable Middle Eastern privacy laws;</li>
          <li>applicable Pakistani data-protection requirements; and</li>
          <li>other applicable local privacy legislation.</li>
        </ul>
        <p>
          Where mandatory local law provides additional rights or
          protections, those rights will apply to the extent required.
        </p>
      </section>

      <section>
        <h2>See also</h2>
        <p>
          Read our{" "}
          <Link href="/terms" className="text-blue-600 hover:underline">
            Terms &amp; Conditions
          </Link>{" "}
          for the rules governing your use of the Platform.
        </p>
      </section>
    </LegalPage>
  );
}
