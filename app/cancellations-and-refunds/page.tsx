import { getSiteSettings } from "@/lib/site-settings"

export default async function CancellationsAndRefundsPage() {
  const { contactPhone } = await getSiteSettings()

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Cancellations and Refunds Policy</h1>

      <div className="prose prose-lg max-w-none space-y-6">
        <p className="text-sm text-muted-foreground">Last updated: 10 December 2025</p>

        <p className="leading-relaxed">
          At Rivaayat, we strive to provide you with the best products and service. However, we understand that
          sometimes you may need to cancel an order or request a refund. This policy outlines our cancellation and
          refund procedures to ensure transparency and customer satisfaction.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Order Cancellation</h2>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">1.1 Cancellation by Customer</h3>
        <p className="leading-relaxed">
          You may cancel your order under the following conditions:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Before Dispatch:</strong> Orders can be canceled free of charge at any time before they are
            dispatched. To cancel, contact us immediately at {contactPhone} or email rivaayatbiz@gmail.com with your order
            number.
          </li>
          <li>
            <strong>After Dispatch:</strong> Once an order has been shipped, it cannot be canceled. You may refuse
            delivery or initiate a return once you receive the product (subject to our return policy).
          </li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">1.2 Cancellation by Rivaayat</h3>
        <p className="leading-relaxed">
          We reserve the right to cancel any order in the following situations:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Product unavailability or out of stock</li>
          <li>Pricing or product description errors</li>
          <li>Inability to verify payment information</li>
          <li>Suspected fraudulent or unauthorized transactions</li>
          <li>Unserviceable delivery location</li>
        </ul>
        <p className="leading-relaxed">
          If we cancel your order, we will notify you via email or phone, and a full refund will be processed within
          7-10 business days.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Refund Policy</h2>

        <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Eligibility for Refunds</h3>
        <p className="leading-relaxed">You may be eligible for a refund in the following cases:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Order canceled before dispatch</li>
          <li>Order canceled by Rivaayat due to unavailability or other reasons</li>
          <li>Defective, damaged, or incorrect product received</li>
          <li>Non-delivery of order within the promised timeline (after investigation)</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Non-Refundable Items</h3>
        <p className="leading-relaxed">The following items are not eligible for refunds:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Customized or personalized products made to order</li>
          <li>Products marked as &ldquo;Final Sale&rdquo; or &ldquo;Non-Refundable&rdquo;</li>
          <li>Items that have been worn, washed, altered, or damaged by the customer</li>
          <li>Products without original tags, packaging, or in unsellable condition</li>
          <li>
            Innerwear, intimate apparel, or hygiene-related products (as per government regulations and safety
            standards)
          </li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">2.3 How to Request a Refund</h3>
        <p className="leading-relaxed">To request a refund:</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Contact us within 7 days of receiving your order</li>
          <li>Provide your order number, reason for refund, and supporting photos (if applicable)</li>
          <li>Email us at rivaayatbiz@gmail.com or call {contactPhone}</li>
          <li>Our team will review your request and respond within 2-3 business days</li>
        </ol>

        <h3 className="text-xl font-semibold mt-6 mb-3">2.4 Refund Processing Time</h3>
        <p className="leading-relaxed">Once your refund request is approved:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Refunds will be initiated within 7-10 business days</li>
          <li>The refund amount in Indian Rupees (₹) will be credited to the original payment method used during purchase</li>
          <li>
            It may take an additional 5-7 business days for the refund to reflect in your Indian bank account, depending on your
            bank or payment provider
          </li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">2.5 Partial Refunds</h3>
        <p className="leading-relaxed">Partial refunds may be issued in the following cases:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Products returned in used or altered condition</li>
          <li>Products returned without original packaging or tags</li>
          <li>Partial cancellation of multi-item orders</li>
        </ul>
        <p className="leading-relaxed">
          The refund amount will be determined based on the condition of the product and at Rivaayat&apos;s discretion.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Return Policy</h2>

        <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Return Eligibility</h3>
        <p className="leading-relaxed">
          You may return a product within 7 days of delivery if it meets the following conditions:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Product is unused, unworn, and unwashed</li>
          <li>Original tags, labels, and packaging are intact</li>
          <li>No signs of damage, alteration, or wear</li>
          <li>Product falls under the returnable category (see Non-Returnable Items below)</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Non-Returnable Items</h3>
        <p className="leading-relaxed">The following items cannot be returned:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Customized or made-to-order products</li>
          <li>Innerwear, intimate apparel, or personal care items</li>
          <li>Products marked as &ldquo;Final Sale&rdquo; or &ldquo;Non-Returnable&rdquo;</li>
          <li>Items damaged due to misuse or mishandling by the customer</li>
          <li>Products without original packaging, tags, or invoices</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">3.3 How to Initiate a Return</h3>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Contact us within 7 days of delivery</li>
          <li>Provide your order number and reason for return</li>
          <li>Email rivaayatbiz@gmail.com or call {contactPhone}</li>
          <li>Our team will verify eligibility and provide return instructions</li>
          <li>Pack the product securely with all original tags and packaging</li>
          <li>Ship the product back using the provided return shipping label or courier details</li>
        </ol>

        <h3 className="text-xl font-semibold mt-6 mb-3">3.4 Return Shipping Costs</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Defective/Damaged/Incorrect Product:</strong> Return shipping costs will be borne by Rivaayat. We
            will arrange a reverse pickup at no additional cost.
          </li>
          <li>
            <strong>Change of Mind or Size Issues:</strong> Return shipping charges will be borne by the customer. You
            may ship the product back to us using any courier service.
          </li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">3.5 Return Inspection</h3>
        <p className="leading-relaxed">
          Once we receive your returned product, our quality team will inspect it to ensure it meets our return
          criteria. The inspection typically takes 2-3 business days. If approved, we will proceed with the refund or
          exchange as per your preference.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Exchange Policy</h2>

        <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Exchange Eligibility</h3>
        <p className="leading-relaxed">You may exchange a product for:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>A different size of the same product</li>
          <li>A different color/variant of the same product (subject to availability)</li>
        </ul>
        <p className="leading-relaxed">Exchanges are subject to stock availability and must be requested within 7 days of delivery.</p>

        <h3 className="text-xl font-semibold mt-6 mb-3">4.2 How to Request an Exchange</h3>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Contact us at rivaayatbiz@gmail.com or {contactPhone} within 7 days of delivery</li>
          <li>Provide your order number and exchange preference (size/color/variant)</li>
          <li>Our team will verify availability and provide exchange instructions</li>
          <li>Return the original product as per our return process</li>
          <li>Once received and inspected, we will dispatch the exchanged product</li>
        </ol>

        <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Exchange Shipping Costs</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>For defective or incorrect products: Exchange shipping is free</li>
          <li>For size/color exchanges: Forward shipping for the new product may apply</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Damaged or Defective Products</h2>
        <p className="leading-relaxed">
          If you receive a damaged or defective product:
        </p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Contact us immediately (within 48 hours of delivery) with photos of the damage/defect</li>
          <li>Do not use or wash the product</li>
          <li>We will arrange a free return pickup</li>
          <li>Once verified, you will receive a replacement or full refund (including shipping charges)</li>
        </ol>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Wrong Product Delivered</h2>
        <p className="leading-relaxed">
          If you receive a product different from what you ordered:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Contact us within 48 hours with your order number and photos</li>
          <li>We will arrange a reverse pickup at no cost</li>
          <li>The correct product will be shipped immediately, or a full refund will be issued</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Non-Delivery or Lost Orders</h2>
        <p className="leading-relaxed">
          If your order shows as &ldquo;Delivered&rdquo; but you have not received it:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Check with neighbors, building security, or family members</li>
          <li>Verify the delivery address in your order details</li>
          <li>Contact us within 48 hours at {contactPhone} or rivaayatbiz@gmail.com</li>
          <li>We will investigate with the courier and provide a resolution within 7-10 business days</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Refund for Prepaid Orders</h2>
        <p className="leading-relaxed">For prepaid orders (paid via online payment in Indian Rupees - ₹):</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Refunds in INR (₹) are credited to the original payment method (debit/credit card, UPI, net banking, digital wallet, etc.)</li>
          <li>Processing time: 7-10 business days from approval</li>
          <li>Indian bank processing time: Additional 5-7 business days</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Refund for Cash on Delivery (COD) Orders</h2>
        <p className="leading-relaxed">For COD orders (payment collected in Indian Rupees - ₹):</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Refunds in INR (₹) are processed via Indian bank transfer (NEFT/IMPS/RTGS)</li>
          <li>You will need to provide your Indian bank account details (Account Number, IFSC Code, Account Holder Name, Bank Name)</li>
          <li>Refund processing time: 10-15 business days</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">10. Store Credit</h2>
        <p className="leading-relaxed">
          In certain cases, instead of a refund, we may offer store credit in Indian Rupees (₹) that can be used for future purchases on our
          website. Store credit:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Does not expire</li>
          <li>Can be used across all products (value in INR)</li>
          <li>Is non-transferable and linked to your account</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">11. Cancellation/Refund Charges</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>No cancellation charges for orders canceled before dispatch</li>
          <li>For returns due to customer preference, return shipping charges may apply</li>
          <li>For COD orders returned without acceptance, a nominal handling fee may be deducted from the refund</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">12. Fraudulent Transactions</h2>
        <p className="leading-relaxed">
          If we suspect fraudulent activity or misuse of our cancellation/refund policy, we reserve the right to:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Reject cancellation or refund requests</li>
          <li>Cancel orders without prior notice</li>
          <li>Suspend or block user accounts</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">13. Governing Law and Consumer Rights</h2>
        <p className="leading-relaxed">
          This policy is governed by the laws of India. All transactions are subject to the Consumer Protection Act, 2019,
          and other applicable Indian regulations. Disputes, if any, shall be subject to the exclusive jurisdiction of the
          courts in Mumbai, Maharashtra, India.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">14. Changes to This Policy</h2>
        <p className="leading-relaxed">
          Rivaayat reserves the right to modify this Cancellations and Refunds Policy at any time without prior notice.
          Any changes will be posted on this page with a new &ldquo;Last Updated&rdquo; date.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">15. Contact Us</h2>
        <p className="leading-relaxed">
          For any queries, concerns, or assistance regarding cancellations, returns, or refunds, please reach out to
          us:
          <br />
          <br />
          Rivaayat &ndash; Regal Roots, Modern Comforts
          <br />
          Email: <a href="mailto:rivaayatbiz@gmail.com">rivaayatbiz@gmail.com</a>
          <br />
          Phone: {contactPhone}
          <br />
          <br />
          We are here to ensure your shopping experience is smooth and satisfactory. Thank you for choosing Rivaayat!
        </p>
      </div>
    </div>
  )
}
