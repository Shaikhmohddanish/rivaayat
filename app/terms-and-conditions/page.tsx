export default function TermsAndConditionsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Terms and Conditions</h1>

      <div className="prose prose-lg max-w-none space-y-6">
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Agreement to Terms</h2>
        <p className="leading-relaxed">
          By accessing and using Rivaayat's website and services, you agree to be bound by these Terms and Conditions.
          If you do not agree with any part of these terms, you may not use our services.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Use of Our Service</h2>
        <p className="leading-relaxed">
          You agree to use our service only for lawful purposes and in accordance with these Terms. You agree not to:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Use the service in any way that violates applicable laws or regulations</li>
          <li>Impersonate or attempt to impersonate Rivaayat or any other person or entity</li>
          <li>Engage in any conduct that restricts or inhibits anyone's use of the service</li>
          <li>Use any automated system to access the service</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Orders and Payment</h2>
        <p className="leading-relaxed">
          All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order for
          any reason. Prices are subject to change without notice. Payment must be received before orders are processed.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Shipping and Delivery</h2>
        <p className="leading-relaxed">
          We aim to process and ship orders promptly. Delivery times are estimates and not guaranteed. Risk of loss and
          title for items purchased pass to you upon delivery to the carrier.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Returns and Refunds</h2>
        <p className="leading-relaxed">
          We accept returns within a specified period from the date of delivery. Items must be unused, in original
          condition, and with all tags attached. Refunds will be processed to the original payment method.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Intellectual Property</h2>
        <p className="leading-relaxed">
          All content on this website, including text, graphics, logos, and images, is the property of Rivaayat and
          protected by copyright and other intellectual property laws.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Limitation of Liability</h2>
        <p className="leading-relaxed">
          Rivaayat shall not be liable for any indirect, incidental, special, consequential, or punitive damages
          resulting from your use of or inability to use the service.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Changes to Terms</h2>
        <p className="leading-relaxed">
          We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to
          the website. Your continued use of the service constitutes acceptance of the modified terms.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Information</h2>
        <p className="leading-relaxed">
          For questions about these Terms and Conditions, please contact us through our website or customer service
          channels.
        </p>
      </div>
    </div>
  )
}
