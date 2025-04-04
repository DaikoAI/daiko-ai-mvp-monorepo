import { Button } from "@/components/ui/button";
import type { NextPage } from "next";
import Link from "next/link";

const TermsPage: NextPage = () => {
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
            <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
            <p className="mt-1 text-sm text-zinc-400">Last updated: June 1, 2024</p>
          </div>
          <div className="px-4 py-5 sm:p-6 prose prose-invert max-w-none text-zinc-300">
            <h2 className="text-xl font-semibold mb-4 text-white">1. Introduction</h2>
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the AI trading assistant application
              (&ldquo;Service&rdquo;) provided by DAIKO (&ldquo;Company&rdquo;). By using the Service, you agree to be
              bound by these Terms.
            </p>

            <h2 className="text-xl font-semibold mb-4 mt-6 text-white">2. Service Description</h2>
            <p>
              The Service is an AI-powered information and analysis tool for cryptocurrency trading. The Company does
              not directly provide investment advice or execute trades on behalf of users.
            </p>

            <h2 className="text-xl font-semibold mb-4 mt-6 text-white">3. Eligibility</h2>
            <p>To use the Service, you must agree to the following conditions:</p>
            <ul className="list-disc pl-5 mt-2 mb-4 text-zinc-300">
              <li>You are at least 18 years of age</li>
              <li>You provide accurate information</li>
              <li>You are responsible for managing your account information</li>
              <li>You comply with all applicable laws and regulations</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4 mt-6 text-white">4. Risk Disclosure and Disclaimer</h2>
            <p>
              Cryptocurrency investments involve significant risk. The information provided by the Service is for
              reference only and does not guarantee investment returns. Users make investment decisions at their own
              risk, and the Company is not liable for any investment losses.
            </p>

            <h2 className="text-xl font-semibold mb-4 mt-6 text-white">5. Privacy and Data</h2>
            <p>
              Our Privacy Policy is an integral part of these Terms. By using the Service, you agree to our Privacy
              Policy.
            </p>

            <h2 className="text-xl font-semibold mb-4 mt-6 text-white">6. Intellectual Property</h2>
            <p>
              All intellectual property rights related to the Service belong to the Company or its legitimate licensors.
              Users may only use the Service for personal and non-commercial purposes.
            </p>

            <h2 className="text-xl font-semibold mb-4 mt-6 text-white">7. Amendments</h2>
            <p>
              The Company may modify these Terms at its discretion. Modified Terms will be effective upon notification
              on the Service.
            </p>

            <h2 className="text-xl font-semibold mb-4 mt-6 text-white">8. Governing Law and Jurisdiction</h2>
            <p>
              These Terms are governed by the laws of Japan, and any disputes related to these Terms shall be subject to
              the exclusive jurisdiction of the Tokyo District Court as the court of first instance.
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

export default TermsPage;
