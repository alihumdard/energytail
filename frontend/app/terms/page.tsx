import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms governing your access to and use of the Energy Tail platform.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      updated="21 September 2026"
      intro={
        'Welcome to Energy Tail. These Terms & Conditions ("Terms") govern your access to and use of the Energy Tail website, platform, services, accounts, job listings, employer services, career resources, and related features (collectively, the "Platform"). By accessing or using Energy Tail, creating an account, posting a job, applying for a position, submitting content, or purchasing a service, you agree to be bound by these Terms. If you do not agree with these Terms, you should not use the Platform.'
      }
    >
      <section>
        <h2>1. About Energy Tail</h2>
        <p>
          Energy Tail is an online employment and professional networking
          platform focused on the oil, gas, energy, renewable energy,
          petrochemical, power, LNG, offshore, and related industries.
        </p>
        <p>Energy Tail may:</p>
        <ul>
          <li>publish and display employment opportunities;</li>
          <li>allow candidates to search and save jobs;</li>
          <li>provide job alerts and career-related resources;</li>
          <li>
            allow employers to create company profiles and publish vacancies;
          </li>
          <li>provide paid job-posting and promotional services;</li>
          <li>allow users to upload CVs and professional information;</li>
          <li>publish articles and industry-related content; and</li>
          <li>provide other services and features from time to time.</li>
        </ul>
        <p>
          Energy Tail is a technology platform and job marketplace. Unless
          expressly stated otherwise, Energy Tail is not a recruitment agency,
          employer, staffing company, employment agency, or representative of
          any employer or candidate.
        </p>
      </section>

      <section>
        <h2>2. Eligibility</h2>
        <p>
          You must be at least 16 years old to create or maintain an account,
          unless applicable law requires a higher minimum age.
        </p>
        <p>By using the Platform, you confirm that:</p>
        <ul>
          <li>you meet the applicable minimum age requirement;</li>
          <li>you have the legal capacity to enter into these Terms;</li>
          <li>the information you provide is accurate and current;</li>
          <li>you will maintain the accuracy of your account information; and</li>
          <li>you will comply with all applicable laws and regulations.</li>
        </ul>
        <p>
          If you are using Energy Tail on behalf of a company or other
          organization, you confirm that you have authority to bind that
          organization to these Terms.
        </p>
      </section>

      <section>
        <h2>3. Accounts</h2>
        <p>Certain features require registration.</p>
        <p>You are responsible for:</p>
        <ul>
          <li>keeping your login credentials confidential;</li>
          <li>all activity conducted through your account;</li>
          <li>providing accurate and complete information;</li>
          <li>
            notifying Energy Tail if you believe your account has been
            compromised; and
          </li>
          <li>maintaining the security of your account.</li>
        </ul>
        <p>
          You must not share, sell, transfer, or otherwise provide access to
          your account to another person without our permission.
        </p>
        <p>
          Energy Tail may suspend or terminate accounts that violate these
          Terms, applicable law, or the security or integrity of the Platform.
        </p>
      </section>

      <section>
        <h2>4. Job Seekers</h2>
        <p>
          Job seekers may use Energy Tail to search for employment
          opportunities and related career information.
        </p>
        <p>Energy Tail does not guarantee:</p>
        <ul>
          <li>that a particular job will remain available;</li>
          <li>
            that a job advertisement is accurate, complete, current, or
            genuine;
          </li>
          <li>that an employer will contact you;</li>
          <li>that an application will be reviewed;</li>
          <li>that you will receive an interview or employment offer;</li>
          <li>
            the salary, benefits, working conditions, or other terms stated
            in a job listing; or
          </li>
          <li>that a position will ultimately be filled.</li>
        </ul>
        <p>
          Job listings are generally provided by employers or other third
          parties. Candidates should independently verify employment
          opportunities, employers, compensation, qualifications, visa
          requirements, locations, and other relevant information before
          making decisions.
        </p>
      </section>

      <section>
        <h2>5. Job Applications</h2>
        <p>
          Where a job listing provides an external application link or
          employer contact information, selecting &quot;Apply&quot; may
          redirect you to the employer&apos;s website, application system,
          email address, or another third-party service.
        </p>
        <p>
          Unless expressly stated otherwise, Energy Tail does not receive,
          process, or control applications submitted directly to employers.
        </p>
        <p>
          Once you leave Energy Tail and interact with an employer or
          third-party application system, that interaction may be governed by
          the third party&apos;s own terms and privacy policy.
        </p>
        <p>Energy Tail is not responsible for:</p>
        <ul>
          <li>an employer&apos;s recruitment process;</li>
          <li>application decisions;</li>
          <li>delays or failures in processing applications;</li>
          <li>rejection of applications;</li>
          <li>employer communications;</li>
          <li>employment contracts;</li>
          <li>employment disputes; or</li>
          <li>any conduct of an employer or candidate.</li>
        </ul>
      </section>

      <section>
        <h2>6. Employer Accounts and Job Listings</h2>
        <p>
          Employers may use Energy Tail to advertise genuine employment
          opportunities and promote their organizations.
        </p>
        <p>Employers agree that:</p>
        <ul>
          <li>they have authority to advertise the positions they post;</li>
          <li>
            job listings must be genuine and relate to actual employment
            opportunities;
          </li>
          <li>listings must contain accurate and non-misleading information;</li>
          <li>
            listings must comply with applicable employment and
            anti-discrimination laws;
          </li>
          <li>
            they will not require candidates to pay inappropriate fees to
            apply for employment;
          </li>
          <li>
            they will not use listings primarily to collect CVs or personal
            information without a legitimate recruitment purpose;
          </li>
          <li>they will not impersonate another company or organization;</li>
          <li>
            they will not post fraudulent, misleading, defamatory, or
            unlawful content; and
          </li>
          <li>
            they will not use the Platform to conduct scams, phishing, or
            other fraudulent activities.
          </li>
        </ul>
        <p>
          Energy Tail may review, reject, edit, restrict, suspend, or remove
          any listing or employer account that we reasonably believe violates
          these Terms or applicable law.
        </p>
      </section>

      <section>
        <h2>7. Employer Subscriptions and Paid Services</h2>
        <p>Certain employer services may require payment.</p>
        <p>
          Prices, plans, features, posting limits, billing periods, and other
          commercial terms will be displayed at the time of purchase or on
          the applicable pricing page.
        </p>
        <p>Unless otherwise stated:</p>
        <ul>
          <li>subscriptions may automatically renew for successive billing periods;</li>
          <li>
            cancellation prevents future renewal but does not necessarily
            refund the current billing period;
          </li>
          <li>unused job-posting allowances generally do not carry forward;</li>
          <li>
            job postings may count toward a plan&apos;s allowance when
            submitted, regardless of whether they are subsequently deleted;
          </li>
          <li>
            Energy Tail may change pricing or plans by providing appropriate
            notice where required by law; and
          </li>
          <li>
            taxes, duties, or other charges may apply depending on the
            purchaser&apos;s location.
          </li>
        </ul>
      </section>

      <section>
        <h2>8. Payments</h2>
        <p>Payments may be processed by third-party payment providers.</p>
        <p>
          Energy Tail may receive information such as payment status,
          transaction amount, invoice information, and payment references,
          while payment card details may be handled directly by the
          applicable payment processor.
        </p>
        <p>
          You authorize the applicable payment provider to charge the payment
          method you provide for purchases and recurring subscriptions.
        </p>
        <p>
          If a payment fails, Energy Tail may suspend paid features, retry
          the payment, restrict account functionality, or take other
          reasonable action.
        </p>
      </section>

      <section>
        <h2>9. Refunds and Cancellations</h2>
        <p>
          Unless a different refund policy is expressly displayed for a
          particular product or service:
        </p>
        <ul>
          <li>subscription cancellations apply to future billing periods;</li>
          <li>
            fees already paid are generally non-refundable once a paid
            service or billing period has commenced;
          </li>
          <li>refunds may be issued where required by applicable law; and</li>
          <li>
            Energy Tail may provide refunds or credits at its discretion in
            exceptional circumstances.
          </li>
        </ul>
        <p>
          Nothing in this section removes any mandatory consumer rights that
          apply under applicable law.
        </p>
      </section>

      <section>
        <h2>10. Featured Listings and Promotional Placement</h2>
        <p>
          Energy Tail may offer featured jobs, sponsored listings, company
          promotions, or other paid placement services.
        </p>
        <p>Paid placement does not guarantee:</p>
        <ul>
          <li>applications;</li>
          <li>interviews;</li>
          <li>hiring;</li>
          <li>candidate quality;</li>
          <li>ranking in external search engines; or</li>
          <li>any particular employment outcome.</li>
        </ul>
        <p>
          Energy Tail determines the manner and duration of promotional
          placement subject to the applicable service description.
        </p>
      </section>

      <section>
        <h2>11. User Content</h2>
        <p>
          Users may submit information, CVs, photographs, company
          information, job advertisements, articles, comments, profiles, and
          other content (&quot;User Content&quot;).
        </p>
        <p>You retain ownership of User Content that you lawfully own.</p>
        <p>
          By submitting User Content, you grant Energy Tail a non-exclusive,
          worldwide, royalty-free license to host, store, reproduce, display,
          distribute, format, and otherwise use that content as reasonably
          necessary to operate, promote, improve, and provide the Platform.
        </p>
        <p>You represent that:</p>
        <ul>
          <li>you own or have the necessary rights to submit the content;</li>
          <li>the content does not infringe another person&apos;s rights;</li>
          <li>the content is accurate to the extent accuracy is required;</li>
          <li>the content does not violate applicable law; and</li>
          <li>the content does not contain malicious software or harmful code.</li>
        </ul>
      </section>

      <section>
        <h2>12. CVs and Professional Information</h2>
        <p>Candidates may upload CVs and other professional information.</p>
        <p>
          You are responsible for ensuring that the information you provide
          is accurate and that you have permission to disclose information
          relating to other individuals.
        </p>
        <p>
          Energy Tail may store uploaded CVs and related information in
          accordance with its Privacy Policy.
        </p>
        <p>
          Unless a particular feature expressly states otherwise, uploading a
          CV does not automatically mean that your CV will be publicly
          searchable or made available to employers.
        </p>
      </section>

      <section>
        <h2>13. Articles and Editorial Content</h2>
        <p>Users may be permitted to submit articles or professional content.</p>
        <p>
          Energy Tail may review, edit, reject, publish, remove, or modify
          submitted content.
        </p>
        <p>
          You retain ownership of your original copyrightable material,
          subject to the license granted to Energy Tail under these Terms.
        </p>
        <p>You must not submit:</p>
        <ul>
          <li>plagiarized material;</li>
          <li>content that infringes copyright or other intellectual property rights;</li>
          <li>undisclosed paid promotional content;</li>
          <li>misleading commercial content;</li>
          <li>defamatory or unlawful content; or</li>
          <li>
            content primarily submitted to manipulate search rankings or
            generate unauthorized links.
          </li>
        </ul>
      </section>

      <section>
        <h2>14. Prohibited Activities</h2>
        <p>You must not:</p>
        <ul>
          <li>violate any applicable law;</li>
          <li>provide false or misleading information;</li>
          <li>create fraudulent accounts;</li>
          <li>impersonate another person or organization;</li>
          <li>access another user&apos;s account without authorization;</li>
          <li>attempt to obtain unauthorized access to Platform systems;</li>
          <li>
            scrape, harvest, copy, reproduce, or bulk-download Platform data
            without permission;
          </li>
          <li>
            use automated systems to access the Platform in a manner that
            places unreasonable load on our systems;
          </li>
          <li>distribute malware, viruses, or malicious code;</li>
          <li>interfere with Platform security or operation;</li>
          <li>send spam or unsolicited commercial communications;</li>
          <li>
            use the Platform for phishing, fraud, scams, or illegal
            recruitment schemes;
          </li>
          <li>
            collect personal information from other users for unauthorized
            purposes;
          </li>
          <li>
            reproduce or commercially exploit Energy Tail content without
            permission;
          </li>
          <li>
            use job listings or candidate information for purposes unrelated
            to legitimate recruitment or the operation of the Platform; or
          </li>
          <li>
            attempt to circumvent any security, access, usage, or payment
            restrictions.
          </li>
        </ul>
      </section>

      <section>
        <h2>15. Intellectual Property</h2>
        <p>
          The Energy Tail name, brand, logos, website design, software,
          graphics, databases, text, features, compilation of information,
          and other Platform materials are owned by or licensed to Energy
          Tail and may be protected by intellectual property laws.
        </p>
        <p>
          Except as expressly permitted by these Terms, you may not copy,
          modify, reproduce, distribute, sell, license, publish, create
          derivative works from, or commercially exploit these materials
          without prior written permission.
        </p>
      </section>

      <section>
        <h2>16. Third-Party Websites and Services</h2>
        <p>
          The Platform may contain links to third-party websites, application
          systems, payment providers, social login providers, employers,
          advertisers, or other services.
        </p>
        <p>Energy Tail does not control third-party websites and is not responsible for their:</p>
        <ul>
          <li>content;</li>
          <li>availability;</li>
          <li>security;</li>
          <li>privacy practices;</li>
          <li>terms;</li>
          <li>products or services; or</li>
          <li>actions.</li>
        </ul>
        <p>
          Your use of third-party services is subject to the applicable third
          party&apos;s terms and policies.
        </p>
      </section>

      <section>
        <h2>17. Accuracy of Information</h2>
        <p>
          We seek to provide useful and accurate information, but Energy Tail
          does not guarantee that all Platform content is complete, accurate,
          current, or error-free.
        </p>
        <p>Job information may be supplied by employers or other third parties.</p>
        <p>
          You should independently verify important information before
          relying upon it.
        </p>
      </section>

      <section>
        <h2>18. Platform Availability</h2>
        <p>
          We aim to keep Energy Tail available and secure, but we do not
          guarantee uninterrupted or error-free operation.
        </p>
        <p>The Platform may occasionally be unavailable due to:</p>
        <ul>
          <li>maintenance;</li>
          <li>upgrades;</li>
          <li>technical failures;</li>
          <li>cybersecurity incidents;</li>
          <li>third-party service failures;</li>
          <li>telecommunications or internet problems; or</li>
          <li>circumstances outside our reasonable control.</li>
        </ul>
        <p>We may modify, suspend, discontinue, or replace features of the Platform.</p>
      </section>

      <section>
        <h2>19. Disclaimers</h2>
        <p>
          To the maximum extent permitted by applicable law, Energy Tail is
          provided on an &quot;as is&quot; and &quot;as available&quot; basis.
        </p>
        <p>Energy Tail does not guarantee:</p>
        <ul>
          <li>employment;</li>
          <li>recruitment outcomes;</li>
          <li>accuracy of job listings;</li>
          <li>employer conduct;</li>
          <li>candidate conduct;</li>
          <li>uninterrupted access;</li>
          <li>availability of particular jobs;</li>
          <li>accuracy of salary information;</li>
          <li>suitability of any employment opportunity; or</li>
          <li>that the Platform will meet your particular requirements.</li>
        </ul>
        <p>
          Nothing in these Terms excludes a warranty or legal right that
          cannot lawfully be excluded.
        </p>
      </section>

      <section>
        <h2>20. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by applicable law, Energy Tail and
          its owners, directors, officers, employees, contractors,
          affiliates, and service providers will not be liable for indirect,
          incidental, special, consequential, exemplary, or punitive damages
          arising from or related to your use of the Platform.
        </p>
        <p>This includes, where legally permitted, losses arising from:</p>
        <ul>
          <li>employment decisions;</li>
          <li>lost employment opportunities;</li>
          <li>inaccurate job listings;</li>
          <li>interactions between candidates and employers;</li>
          <li>unauthorized access;</li>
          <li>third-party services;</li>
          <li>loss of data;</li>
          <li>business interruption; or</li>
          <li>reliance on Platform content.</li>
        </ul>
        <p>
          Nothing in these Terms excludes liability that cannot legally be
          excluded or limited.
        </p>
      </section>

      <section>
        <h2>21. Indemnification</h2>
        <p>
          To the extent permitted by applicable law, you agree to defend,
          indemnify, and hold harmless Energy Tail and its affiliates,
          officers, directors, employees, contractors, and service providers
          from claims, damages, liabilities, losses, costs, and expenses
          arising from:
        </p>
        <ul>
          <li>your breach of these Terms;</li>
          <li>your User Content;</li>
          <li>your violation of another person&apos;s rights;</li>
          <li>your violation of applicable law; or</li>
          <li>your misuse of the Platform.</li>
        </ul>
      </section>

      <section>
        <h2>22. Account Suspension and Termination</h2>
        <p>
          You may stop using Energy Tail and request closure of your account
          at any time.
        </p>
        <p>
          Energy Tail may suspend or terminate an account where reasonably
          necessary because of:
        </p>
        <ul>
          <li>violation of these Terms;</li>
          <li>fraudulent or unlawful activity;</li>
          <li>security concerns;</li>
          <li>abuse of the Platform;</li>
          <li>non-payment;</li>
          <li>misuse of other users&apos; information; or</li>
          <li>other conduct that materially harms the Platform or its users.</li>
        </ul>
        <p>
          Termination does not automatically eliminate obligations or rights
          that accrued before termination.
        </p>
      </section>

      <section>
        <h2>23. Changes to These Terms</h2>
        <p>We may update these Terms from time to time.</p>
        <p>The &quot;Last Updated&quot; date will identify the most recent revision.</p>
        <p>Where required by applicable law, we will provide additional notice of material changes.</p>
        <p>
          Your continued use of the Platform after the effective date of
          updated Terms constitutes acceptance of the revised Terms to the
          extent permitted by law.
        </p>
      </section>

      <section>
        <h2>24. Governing Law and Disputes</h2>
        <p>
          These Terms shall be governed by the laws applicable to Energy
          Tail&apos;s operating entity and jurisdiction, except where
          mandatory applicable law provides otherwise.
        </p>
        <p>
          Before initiating formal legal proceedings, the parties should make
          reasonable efforts to resolve disputes by contacting Energy Tail at
          the address below.
        </p>
        <p>
          The applicable company jurisdiction, governing law, courts, and
          dispute-resolution mechanism should be completed by Energy
          Tail&apos;s legal counsel before publication.
        </p>
      </section>

      <section>
        <h2>25. Severability</h2>
        <p>
          If any provision of these Terms is determined to be invalid or
          unenforceable, the remaining provisions will continue in effect to
          the extent permitted by law.
        </p>
      </section>

      <section>
        <h2>26. Entire Agreement</h2>
        <p>
          These Terms, together with applicable policies and service-specific
          terms referenced on the Platform, constitute the agreement between
          you and Energy Tail concerning your use of the Platform, except
          where a separate written agreement applies.
        </p>
      </section>

      <section>
        <h2>27. Contact</h2>
        <p>
          For questions, complaints, account matters, or notices concerning
          these Terms:
        </p>
        <p>
          Email:{" "}
          <a href="mailto:info@energytail.com" className="text-blue-600 hover:underline">
            info@energytail.com
          </a>
          <br />
          Website:{" "}
          <a href="https://www.energytail.com/" className="text-blue-600 hover:underline">
            https://www.energytail.com/
          </a>
        </p>
      </section>
    </LegalPage>
  );
}
