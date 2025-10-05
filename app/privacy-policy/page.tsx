export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

      <div className="prose prose-lg max-w-none space-y-6">
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Introduction</h2>
        <p className="leading-relaxed">
          At Rivaayat, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use,
          disclose, and safeguard your information when you visit our website and use our services.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Information We Collect</h2>
        <p className="leading-relaxed">We collect information that you provide directly to us, including:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Name and contact information</li>
          <li>Shipping and billing addresses</li>
          <li>Payment information</li>
          <li>Order history and preferences</li>
          <li>Account credentials</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">How We Use Your Information</h2>
        <p className="leading-relaxed">We use the information we collect to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Process and fulfill your orders</li>
          <li>Communicate with you about your orders and account</li>
          <li>Improve our products and services</li>
          <li>Send you marketing communications (with your consent)</li>
          <li>Prevent fraud and enhance security</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Data Security</h2>
        <p className="leading-relaxed">
          We implement appropriate technical and organizational measures to protect your personal information against
          unauthorized access, alteration, disclosure, or destruction.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Your Rights</h2>
        <p className="leading-relaxed">You have the right to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Access your personal information</li>
          <li>Correct inaccurate information</li>
          <li>Request deletion of your information</li>
          <li>Opt-out of marketing communications</li>
          <li>Withdraw consent at any time</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Us</h2>
        <p className="leading-relaxed">
          If you have any questions about this Privacy Policy, please contact us through our website or customer service
          channels.
        </p>
      </div>
    </div>
  )
}
