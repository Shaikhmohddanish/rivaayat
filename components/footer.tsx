import Link from "next/link"
import { Facebook, Instagram, Twitter } from "lucide-react"
import { ISTClock } from "@/components/ist-clock"
import type { SiteSettings } from "@/lib/types"

interface FooterProps {
  siteSettings?: Pick<SiteSettings, "contactEmail" | "contactPhone" | "freeShippingThreshold">
}

export function Footer({ siteSettings }: FooterProps) {
  const contactEmail = siteSettings?.contactEmail || "sales@rivaayatposhak.co.in"
  const contactPhone = siteSettings?.contactPhone || "+918097787110"
  const shippingThreshold = siteSettings?.freeShippingThreshold || 1499
  return (
    <footer className="bg-linear-to-b from-muted/50 to-muted mt-auto border-t border-border/20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Social */}
          <div>
            <h3 className="text-xl font-bold mb-4 elegant-gradient bg-clip-text text-transparent">Rivaayat</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Riwayaat is not only worn, it is lived. A movement where women are the creators of tradition's future, not just its keepers.
            </p>
            <h4 className="font-semibold mb-4 text-foreground">Follow Us</h4>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-all duration-300 transform hover:scale-110 elegant-hover">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="https://www.instagram.com/rivaayat.poshak/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-all duration-300 transform hover:scale-110 elegant-hover">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-all duration-300 transform hover:scale-110 elegant-hover">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
            </div>
          </div>
          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/shop" className="text-muted-foreground hover:text-primary transition-all duration-300 elegant-hover inline-block">
                  Shop Dresses
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-all duration-300 elegant-hover inline-block">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-muted-foreground hover:text-primary transition-all duration-300 elegant-hover inline-block">
                  My Orders
                </Link>
              </li>
              <li>
                <Link href="/order-tracking" className="text-muted-foreground hover:text-primary transition-all duration-300 elegant-hover inline-block">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-all duration-300 elegant-hover inline-block">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-and-conditions"
                  className="text-muted-foreground hover:text-primary transition-all duration-300 elegant-hover inline-block"
                >
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Contact</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Shipping</p>
              <p>Free shipping on orders above ₹{shippingThreshold}.</p>
              <p className="font-medium text-foreground">Office Address</p>
              <p>C/310 Crystal Plaza, Lower Oshiwara, Andheri West, Mumbai 400056</p>
              <p className="font-medium text-foreground">Write to us</p>
              <a href={`mailto:${contactEmail}`} className="hover:text-primary transition-colors">
                {contactEmail}
              </a>
            </div>
          </div>

          
        </div>

        <div className="border-t border-border/30 mt-8 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} <span className="elegant-gradient bg-clip-text text-transparent font-medium">Rivaayat</span>. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <ISTClock />
              <span className="text-xs text-muted-foreground">All times in IST</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
