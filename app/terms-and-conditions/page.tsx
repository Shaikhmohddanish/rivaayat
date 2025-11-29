import { getSiteSettings } from "@/lib/site-settings"

export default async function TermsAndConditionsPage() {
  const { contactPhone } = await getSiteSettings()

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Terms &amp; Conditions</h1>

      <div className="prose prose-lg max-w-none space-y-6">
        <p className="text-sm text-muted-foreground">Last updated: 29 November 2025</p>

        <p className="leading-relaxed">
          Welcome to Rivaayat (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;). By accessing or purchasing from our website,
          social media pages, or offline platforms, you agree to the following Terms &amp; Conditions. Please read them
          carefully.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">1. General</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>These Terms apply to all users of our website and customers purchasing our products.</li>
          <li>By using our services, you confirm that you are at least 18 years old or have parental consent.</li>
          <li>Rivaayat reserves the right to update or modify these Terms without prior notice.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Product Information</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>We aim to provide accurate product descriptions, images, and details.</li>
          <li>Colours may vary slightly due to lighting, device screens, or photography.</li>
          <li>Minor variations in fabric, embroidery, or measurements are normal in handcrafted or traditional wear.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Orders &amp; Pricing</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>All orders are subject to availability and acceptance.</li>
          <li>Prices are listed in INR unless mentioned otherwise.</li>
          <li>We may modify prices, discontinue items, or limit quantities at any time.</li>
          <li>An order is confirmed only after successful payment.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Payment Terms</h2>
        <p className="leading-relaxed">We accept payments through:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Secure online payment gateways</li>
          <li>UPI</li>
          <li>Debit/Credit Cards</li>
          <li>Bank Transfer (if applicable)</li>
        </ul>
        <p className="leading-relaxed">
          All payments must be completed before dispatch. Rivaayat is not responsible for delays or issues caused by
          third-party payment gateways.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Shipping &amp; Delivery</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Orders are shipped to the address provided during checkout.</li>
          <li>Delivery timelines vary based on location, courier partner, and external factors.</li>
          <li>Tracking details will be shared once the order is shipped.</li>
          <li>Rivaayat is not liable for delays caused by courier services, weather, strikes, or natural events.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Returns, Exchange &amp; Refunds</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Easy returns/exchanges are available for eligible products (if mentioned on the product page).</li>
          <li>Products must be unused, unwashed, undamaged, and with all tags intact.</li>
          <li>Non-returnable items include custom-stitched items, sale/clearance items, accessories, and items damaged by customers.</li>
          <li>Refunds (if applicable) are issued as store credit or to the original payment method per our policy.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Size &amp; Fit</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Size measurements are approximate and may vary slightly.</li>
          <li>Customers are responsible for selecting the correct size using our size chart.</li>
          <li>Any alterations after delivery are the customer&rsquo;s responsibility.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Intellectual Property</h2>
        <p className="leading-relaxed">
          All content on Rivaayat platforms&mdash;including logos, images, product designs, text, graphics, and the brand
          name &ldquo;Rivaayat &ndash; Regal Roots, Modern Comforts&rdquo;&mdash;is the intellectual property of Rivaayat.
          Unauthorized copying, reproduction, or commercial use is strictly prohibited.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">9. User Obligations</h2>
        <p className="leading-relaxed">By using our platforms, you agree NOT to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Post false information</li>
          <li>Abuse or misuse the platform</li>
          <li>Attempt to hack or disrupt the website</li>
          <li>Copy or sell our products or designs</li>
          <li>Use our content without permission</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">10. Limitation of Liability</h2>
        <p className="leading-relaxed">
          Rivaayat is not responsible for losses due to incorrect addresses provided by customers, damage after delivery,
          delays in delivery due to courier or unforeseen circumstances, misuse/mishandling of products, or any indirect
          or consequential damages. Our total liability shall not exceed the value of your order.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">11. Cancellation Policy</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Orders can be canceled only before dispatch.</li>
          <li>Once shipped, cancellation is not possible.</li>
          <li>Approved cancellations are refunded per our refund process.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">12. Third-Party Links</h2>
        <p className="leading-relaxed">
          We may include links to external websites. Rivaayat is not responsible for the content, services, or privacy
          practices of third-party websites.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">13. Governing Law</h2>
        <p className="leading-relaxed">
          These Terms are governed by the laws of India. Any disputes will fall under the jurisdiction of Mumbai,
          Maharashtra, unless otherwise required by law.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">14. Contact Information</h2>
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
