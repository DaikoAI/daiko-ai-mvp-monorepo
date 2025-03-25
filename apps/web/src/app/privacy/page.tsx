import { Button } from "@/components/ui/button";
import { NextPage } from "next";
import Link from "next/link";

const PrivacyPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center">
            <svg
              className="w-8 h-8 mr-2 text-[oklch(0.65_0.15_27.5)]"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="0.5"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="text-xl font-bold text-white">DAIKO</span>
          </Link>
        </div>

        <div className="bg-zinc-900 shadow overflow-hidden rounded-lg border border-zinc-800">
          <div className="px-4 py-5 sm:px-6 border-b border-zinc-800">
            <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
            <p className="mt-1 text-sm text-zinc-400">Last updated: June 1, 2024</p>
          </div>
          <div className="px-4 py-5 sm:p-6 prose prose-invert max-w-none text-zinc-300">
            <h2 className="text-xl font-semibold mb-4 text-white">1. Introduction</h2>
            <p>
              DAIKO (&ldquo;Company&rdquo;) respects the privacy of its users and is committed to proper management of
              personal information. This Privacy Policy explains how we handle personal information in our AI trading
              assistant application (&ldquo;Service&rdquo;).
            </p>

            <h2 className="text-xl font-semibold mb-4 mt-6 text-white">2. Information We Collect</h2>
            <p>We may collect the following information:</p>
            <ul className="list-disc pl-5 mt-2 mb-4 text-zinc-300">
              <li>Information provided by users (name, email address, trading history, etc.)</li>
              <li>Automatically collected information (IP address, device information, usage data, etc.)</li>
              <li>Information obtained from third parties (exchange data via API integration, etc.)</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4 mt-6 text-white">3. How We Use Your Information</h2>
            <p>We use collected information for the following purposes:</p>
            <ul className="list-disc pl-5 mt-2 mb-4 text-zinc-300">
              <li>Providing, maintaining, and improving the Service</li>
              <li>User authentication and account management</li>
              <li>Providing personalized experiences</li>
              <li>Customer support</li>
              <li>Detecting and preventing unauthorized use</li>
              <li>Notifying about new features and updates</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4 mt-6 text-white">4. Information Sharing and Disclosure</h2>
            <p>We do not share users&apos; personal information with third parties except in the following cases:</p>
            <ul className="list-disc pl-5 mt-2 mb-4 text-zinc-300">
              <li>With user consent</li>
              <li>When required by law</li>
              <li>
                With partner companies necessary for providing our services (who are bound by similar protection
                obligations)
              </li>
              <li>When using anonymized data for analysis or research purposes</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4 mt-6 text-white">5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational security measures to protect users&apos; personal
              information from unauthorized access, loss, alteration, and leakage. However, please note that data
              transmission over the internet is not completely secure.
            </p>

            <h2 className="text-xl font-semibold mb-4 mt-6 text-white">6. User Rights</h2>
            <p>Users have the following rights:</p>
            <ul className="list-disc pl-5 mt-2 mb-4 text-zinc-300">
              <li>Request to access, correct, or delete personal information</li>
              <li>Request to restrict or object to data processing</li>
              <li>Request data portability</li>
              <li>Withdraw consent</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4 mt-6 text-white">7. Use of Cookies</h2>
            <p>
              We use cookies and similar technologies to enhance functionality and improve user experience of our
              Service. You can disable cookies in your browser settings, but this may limit some Service features.
            </p>

            <h2 className="text-xl font-semibold mb-4 mt-6 text-white">8. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy as necessary. When updated, we will notify you through the Service.
              Please check the latest Privacy Policy regularly.
            </p>

            <h2 className="text-xl font-semibold mb-4 mt-6 text-white">9. Contact Us</h2>
            <p>
              If you have any questions or comments about this Privacy Policy, please contact us at:
              <br />
              <a
                href="mailto:privacy@daiko-ai.com"
                className="text-[oklch(0.65_0.15_27.5)] hover:text-[oklch(0.75_0.15_27.5)]"
              >
                privacy@daiko-ai.com
              </a>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button asChild variant="outline" className="text-white border-zinc-700 hover:bg-zinc-800 hover:text-white">
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
