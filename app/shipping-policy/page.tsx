import { getSiteSettings } from "@/lib/site-settings"

export default async function ShippingPolicyPage() {
  const { contactPhone } = await getSiteSettings()

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Shipping Policy</h1>

      <div className="prose prose-lg max-w-none space-y-6">
        <p className="text-sm text-muted-foreground">Last updated: 10 December 2025</p>

        <p className="leading-relaxed">
          At Rivaayat, we are committed to delivering your orders safely and on time. This Shipping Policy outlines our
          shipping practices, timelines, charges, and other important details.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Shipping Coverage</h2>
        <p className="leading-relaxed">We currently ship to the following locations:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>All states and union territories across India</li>
          <li>Serviceable PIN codes as per our logistics partners</li>
        </ul>
        <p className="leading-relaxed">
          International shipping is currently not available. We are working to expand our reach and will update this
          policy accordingly.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Processing Time</h2>
        <p className="leading-relaxed">
          Order processing time refers to the time taken to prepare your order for shipment:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Ready-to-ship products: 1-2 business days</li>
          <li>Made-to-order products: 7-10 business days</li>
          <li>Customized or personalized items: 10-15 business days</li>
        </ul>
        <p className="leading-relaxed">
          Processing time does not include shipping time. Business days exclude Sundays and national holidays.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Shipping Time</h2>
        <p className="leading-relaxed">
          Once your order is dispatched, the estimated delivery time depends on your location:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Metro cities (Delhi, Mumbai, Bangalore, Chennai, Hyderabad, Kolkata, etc.): 3-5 business days</li>
          <li>Other major cities and towns: 5-7 business days</li>
          <li>Remote or rural areas: 7-10 business days</li>
        </ul>
        <p className="leading-relaxed">
          Delivery times are estimates and may vary due to factors beyond our control, including courier delays, weather
          conditions, or local disruptions.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Shipping Charges</h2>
        <p className="leading-relaxed">Shipping charges (in Indian Rupees - ₹) are calculated based on:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Order value</li>
          <li>Delivery location</li>
          <li>Product weight and dimensions</li>
        </ul>
        <p className="leading-relaxed">
          <strong>Free Shipping:</strong> We offer free shipping on orders above a certain value (as displayed on the
          website). Standard shipping charges apply for orders below this threshold.
        </p>
        <p className="leading-relaxed">
          The exact shipping fee in INR (₹) will be displayed at checkout before you complete your purchase.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Order Tracking</h2>
        <p className="leading-relaxed">
          Once your order is shipped, you will receive a confirmation email/SMS with:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Tracking number</li>
          <li>Courier partner details</li>
          <li>Estimated delivery date</li>
        </ul>
        <p className="leading-relaxed">
          You can track your order in real-time using the tracking link provided or by visiting the &ldquo;My
          Orders&rdquo; section on our website.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Shipping Partners</h2>
        <p className="leading-relaxed">
          We partner with trusted and reliable courier services to ensure safe and timely delivery of your orders. Our
          logistics partners include but are not limited to:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Delhivery</li>
          <li>Blue Dart</li>
          <li>DTDC</li>
          <li>India Post</li>
          <li>Ecom Express</li>
        </ul>
        <p className="leading-relaxed">
          The courier partner may vary depending on your location and product availability.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Address Accuracy</h2>
        <p className="leading-relaxed">
          Please ensure that your shipping address is complete and accurate, including:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Full name</li>
          <li>Complete address with landmarks</li>
          <li>PIN code</li>
          <li>Contact number</li>
        </ul>
        <p className="leading-relaxed">
          Rivaayat is not responsible for delivery delays or failures caused by incorrect, incomplete, or unverifiable
          addresses. If an order is returned due to address issues, re-shipping charges will apply.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Failed Delivery Attempts</h2>
        <p className="leading-relaxed">
          If the courier is unable to deliver your order due to the following reasons:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Recipient unavailable</li>
          <li>Incorrect address</li>
          <li>Refusal to accept delivery</li>
        </ul>
        <p className="leading-relaxed">
          The courier will make 2-3 delivery attempts. If all attempts fail, the order will be returned to us. In such
          cases:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>You will be notified of the return</li>
          <li>A refund will be initiated minus shipping charges</li>
          <li>Re-shipping will require placing a new order and paying shipping fees again</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Damaged or Lost Shipments</h2>
        <p className="leading-relaxed">
          We take every precaution to ensure your order is securely packaged. However, if your order arrives damaged or
          is lost during transit:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Contact us immediately at {contactPhone} or rivaayatbiz@gmail.com with photos of the damaged item/package</li>
          <li>
            Do not accept the delivery if the package is visibly damaged. Request a return to sender and notify us
            immediately
          </li>
          <li>We will investigate the issue with the courier and provide a resolution within 7-10 business days</li>
        </ul>
        <p className="leading-relaxed">
          Resolution may include replacement, refund, or store credit, depending on the circumstances.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">10. Undeliverable Addresses</h2>
        <p className="leading-relaxed">
          Certain remote areas, military bases, or high-risk zones may not be serviceable by our courier partners. In
          such cases:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>We will notify you before dispatch</li>
          <li>You may provide an alternate address or cancel your order for a full refund</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">11. Order Modifications</h2>
        <p className="leading-relaxed">
          If you need to change your shipping address or delivery details:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Contact us immediately at {contactPhone} or rivaayatbiz@gmail.com</li>
          <li>Changes can only be made before the order is dispatched</li>
          <li>Once shipped, address changes are not possible</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">12. Packaging</h2>
        <p className="leading-relaxed">
          All orders are carefully packaged to ensure they reach you in perfect condition:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Products are wrapped in protective materials</li>
          <li>Branded packaging with care instructions (where applicable)</li>
          <li>Eco-friendly packaging materials wherever possible</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">13. Festive Season &amp; High Demand Periods</h2>
        <p className="leading-relaxed">
          During festive seasons, sale periods, or high-demand times, processing and shipping may take longer than
          usual. We recommend:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Placing orders early to avoid delays</li>
          <li>Checking estimated delivery dates at checkout</li>
          <li>Contacting us if you need expedited delivery options</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">14. Cash on Delivery (COD)</h2>
        <p className="leading-relaxed">
          Cash on Delivery may be available for select PIN codes and order values. COD availability will be displayed
          at checkout. Payment must be made in Indian Rupees (₹) only.
        </p>
        <p className="leading-relaxed">COD charges in INR (if applicable) will be mentioned separately at checkout.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">15. International Shipping</h2>
        <p className="leading-relaxed">
          Currently, we do not ship internationally. We are working to expand our services and will update this policy
          when international shipping becomes available.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">16. Contact Us</h2>
        <p className="leading-relaxed">
          For shipping-related queries, concerns, or assistance, please contact us:
          <br />
          <br />
          Rivaayat &ndash; Regal Roots, Modern Comforts
          <br />
          Email: <a href="mailto:rivaayatbiz@gmail.com">rivaayatbiz@gmail.com</a>
          <br />
          Phone: {contactPhone}
          <br />
          <br />
          We are here to help and ensure your shopping experience with Rivaayat is smooth and delightful!
        </p>
      </div>
    </div>
  )
}
