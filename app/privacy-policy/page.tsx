import { getSiteSettings } from "@/lib/site-settings"

export default async function PrivacyPolicyPage() {
  const { contactPhone } = await getSiteSettings()

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

      <div className="prose prose-lg max-w-none space-y-6">
        <p className="text-sm text-muted-foreground">Last updated: 29 November 2025</p>

        <p className="leading-relaxed">
          Rivaayat (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is committed to protecting your privacy. This Privacy Policy
          explains how we collect, use, store, and safeguard your personal information when you interact with our brand,
          website, and services.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
        <p className="leading-relaxed">We may collect the following types of information:</p>
        <h3 className="text-xl font-semibold">A. Personal Information</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Name</li>
          <li>Phone number</li>
          <li>Email address</li>
          <li>Shipping and billing address</li>
          <li>Payment details (processed securely via third-party gateways)</li>
        </ul>
        <h3 className="text-xl font-semibold">B. Non-Personal Information</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>IP address</li>
          <li>Browser type</li>
          <li>Device information</li>
          <li>Pages visited on our website</li>
          <li>Cookies and usage data</li>
        </ul>
        <h3 className="text-xl font-semibold">C. Order &amp; Transaction Data</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Items purchased</li>
          <li>Order history</li>
          <li>Delivery preferences</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
        <p className="leading-relaxed">We use the collected data to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Process and deliver your orders</li>
          <li>Manage payments and refunds</li>
          <li>Communicate order updates</li>
          <li>Improve our products and customer experience</li>
          <li>Provide customer support</li>
          <li>Send promotional offers, discounts, and updates (optional)</li>
          <li>Maintain website security and prevent fraud</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Share Your Information</h2>
        <p className="leading-relaxed">
          We do not sell or trade your personal information. We may share data only with trusted partners who follow strict
          confidentiality and security practices:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Delivery partners for shipping your orders</li>
          <li>Payment gateways for secure transactions</li>
          <li>IT or technical service providers maintaining our website or app</li>
          <li>Legal authorities when required by law</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Security</h2>
        <p className="leading-relaxed">
          We use industry-standard safeguards to protect your data, including encrypted payment processing, secure server
          storage, restricted internal access, and regular security audits. However, no online system is 100% secure, and
          we cannot guarantee absolute protection.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Your Rights</h2>
        <p className="leading-relaxed">You have the right to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Access your personal data</li>
          <li>Request corrections or updates</li>
          <li>Request deletion of your data</li>
          <li>Opt out of marketing communications</li>
          <li>Withdraw consent at any time</li>
        </ul>
        <p className="leading-relaxed">Contact us anytime to exercise these rights.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Cookies Policy</h2>
        <p className="leading-relaxed">
          Our website uses cookies to improve browsing experience, website speed, and personalized product recommendations.
          You can disable cookies in your browser settings if you prefer.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Third-Party Links</h2>
        <p className="leading-relaxed">
          Our website may contain links to third-party websites. We are not responsible for their privacy practices or
          content.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Children&apos;s Privacy</h2>
        <p className="leading-relaxed">
          We do not knowingly collect data from individuals under the age of 13. If you believe a child has provided
          information, please notify us for immediate deletion.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Changes to This Policy</h2>
        <p className="leading-relaxed">
          We may update this Privacy Policy at any time. Changes will be posted on this page with a new &ldquo;Last
          Updated&rdquo; date.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">10. Contact Us</h2>
        <p className="leading-relaxed">
          Rivaayat &ndash; Regal Roots, Modern Comforts
          <br />
          Email: <a href="mailto:rivaayatbiz@gmail.com">rivaayatbiz@gmail.com</a>
          <br />
          Phone: {contactPhone}
        </p>
      </div>
    </div>
  )
}
