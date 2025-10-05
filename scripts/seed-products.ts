import { getDatabase } from "../lib/mongodb"

const sampleProducts = [
  {
    name: "Elegant Floral Maxi Dress",
    slug: "elegant-floral-maxi-dress",
    description:
      "A beautiful flowing maxi dress with delicate floral patterns. Perfect for summer evenings and special occasions. Made from breathable fabric with a comfortable fit.",
    images: [
      {
        publicId: "placeholder-dress-1",
        url: "/elegant-floral-maxi-dress.jpg",
        sortOrder: 0,
      },
      {
        publicId: "placeholder-dress-1-alt",
        url: "/floral-dress-back-view.jpg",
        sortOrder: 1,
      },
    ],
    price: 89.99,
    isFeatured: true,
    variations: {
      colors: ["Rose Pink", "Sky Blue", "Lavender"],
      sizes: ["S", "M", "L", "XL"],
      variants: [
        { color: "Rose Pink", size: "S" },
        { color: "Rose Pink", size: "M" },
        { color: "Rose Pink", size: "L" },
        { color: "Rose Pink", size: "XL" },
        { color: "Sky Blue", size: "S" },
        { color: "Sky Blue", size: "M" },
        { color: "Sky Blue", size: "L" },
        { color: "Sky Blue", size: "XL" },
        { color: "Lavender", size: "S" },
        { color: "Lavender", size: "M" },
        { color: "Lavender", size: "L" },
        { color: "Lavender", size: "XL" },
      ],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Classic Black Evening Dress",
    slug: "classic-black-evening-dress",
    description:
      "Timeless elegance in a sophisticated black evening dress. Features a flattering silhouette and premium fabric. Ideal for formal events and cocktail parties.",
    images: [
      {
        publicId: "placeholder-dress-2",
        url: "/black-evening-dress.jpg",
        sortOrder: 0,
      },
      {
        publicId: "placeholder-dress-2-detail",
        url: "/evening-dress-detail.jpg",
        sortOrder: 1,
      },
      {
        publicId: "placeholder-dress-2-side",
        url: "/black-dress-side.png",
        sortOrder: 2,
      },
    ],
    price: 129.99,
    isFeatured: true,
    variations: {
      colors: ["Black"],
      sizes: ["XS", "S", "M", "L", "XL"],
      variants: [
        { color: "Black", size: "XS" },
        { color: "Black", size: "S" },
        { color: "Black", size: "M" },
        { color: "Black", size: "L" },
        { color: "Black", size: "XL" },
      ],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Bohemian Summer Dress",
    slug: "bohemian-summer-dress",
    description:
      "Free-spirited bohemian dress with intricate embroidery and relaxed fit. Perfect for casual outings and beach days. Lightweight and comfortable.",
    images: [
      {
        publicId: "placeholder-dress-3",
        url: "/bohemian-summer-dress.jpg",
        sortOrder: 0,
      },
    ],
    price: 64.99,
    isFeatured: false,
    variations: {
      colors: ["Cream", "Terracotta", "Sage Green"],
      sizes: ["S", "M", "L"],
      variants: [
        { color: "Cream", size: "S" },
        { color: "Cream", size: "M" },
        { color: "Cream", size: "L" },
        { color: "Terracotta", size: "S" },
        { color: "Terracotta", size: "M" },
        { color: "Terracotta", size: "L" },
        { color: "Sage Green", size: "S" },
        { color: "Sage Green", size: "M" },
        { color: "Sage Green", size: "L" },
      ],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Silk Wrap Midi Dress",
    slug: "silk-wrap-midi-dress",
    description:
      "Luxurious silk wrap dress with adjustable tie waist. Elegant midi length perfect for office or dinner. Smooth, premium silk fabric.",
    images: [
      {
        publicId: "placeholder-dress-4",
        url: "/silk-wrap-midi-dress.jpg",
        sortOrder: 0,
      },
      {
        publicId: "placeholder-dress-4-back",
        url: "/wrap-dress-back.jpg",
        sortOrder: 1,
      },
    ],
    price: 149.99,
    isFeatured: true,
    variations: {
      colors: ["Navy Blue", "Burgundy", "Emerald Green"],
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      variants: [
        { color: "Navy Blue", size: "XS" },
        { color: "Navy Blue", size: "S" },
        { color: "Navy Blue", size: "M" },
        { color: "Navy Blue", size: "L" },
        { color: "Navy Blue", size: "XL" },
        { color: "Navy Blue", size: "XXL" },
        { color: "Burgundy", size: "XS" },
        { color: "Burgundy", size: "S" },
        { color: "Burgundy", size: "M" },
        { color: "Burgundy", size: "L" },
        { color: "Burgundy", size: "XL" },
        { color: "Burgundy", size: "XXL" },
        { color: "Emerald Green", size: "XS" },
        { color: "Emerald Green", size: "S" },
        { color: "Emerald Green", size: "M" },
        { color: "Emerald Green", size: "L" },
        { color: "Emerald Green", size: "XL" },
        { color: "Emerald Green", size: "XXL" },
      ],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Casual Cotton Shirt Dress",
    slug: "casual-cotton-shirt-dress",
    description:
      "Comfortable everyday shirt dress in soft cotton. Features button-front closure and practical pockets. Great for casual wear and weekend outings.",
    images: [
      {
        publicId: "placeholder-dress-5",
        url: "/cotton-shirt-dress.jpg",
        sortOrder: 0,
      },
    ],
    price: 54.99,
    isFeatured: false,
    variations: {
      colors: ["White", "Light Blue", "Khaki"],
      sizes: ["S", "M", "L", "XL"],
      variants: [
        { color: "White", size: "S" },
        { color: "White", size: "M" },
        { color: "White", size: "L" },
        { color: "White", size: "XL" },
        { color: "Light Blue", size: "S" },
        { color: "Light Blue", size: "M" },
        { color: "Light Blue", size: "L" },
        { color: "Light Blue", size: "XL" },
        { color: "Khaki", size: "S" },
        { color: "Khaki", size: "M" },
        { color: "Khaki", size: "L" },
        { color: "Khaki", size: "XL" },
      ],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Vintage Lace Tea Dress",
    slug: "vintage-lace-tea-dress",
    description:
      "Romantic vintage-inspired tea dress with delicate lace details. Perfect for garden parties and afternoon tea. Feminine and charming design.",
    images: [
      {
        publicId: "placeholder-dress-6",
        url: "/vintage-lace-tea-dress.jpg",
        sortOrder: 0,
      },
      {
        publicId: "placeholder-dress-6-detail",
        url: "/lace-dress-detail.jpg",
        sortOrder: 1,
      },
    ],
    price: 94.99,
    isFeatured: false,
    variations: {
      colors: ["Blush Pink", "Ivory", "Mint Green"],
      sizes: ["XS", "S", "M", "L"],
      variants: [
        { color: "Blush Pink", size: "XS" },
        { color: "Blush Pink", size: "S" },
        { color: "Blush Pink", size: "M" },
        { color: "Blush Pink", size: "L" },
        { color: "Ivory", size: "XS" },
        { color: "Ivory", size: "S" },
        { color: "Ivory", size: "M" },
        { color: "Ivory", size: "L" },
        { color: "Mint Green", size: "XS" },
        { color: "Mint Green", size: "S" },
        { color: "Mint Green", size: "M" },
        { color: "Mint Green", size: "L" },
      ],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

async function seedProducts() {
  try {
    console.log("[v0] Starting product seeding...")

    const db = await getDatabase()
    const productsCollection = db.collection("products")

    // Check if products already exist
    const existingCount = await productsCollection.countDocuments()

    if (existingCount > 0) {
      console.log(`[v0] Database already has ${existingCount} products. Skipping seed.`)
      console.log("[v0] To re-seed, delete existing products first.")
      return
    }

    // Insert sample products
    const result = await productsCollection.insertMany(sampleProducts)

    console.log(`[v0] Successfully seeded ${result.insertedCount} products!`)
    console.log("[v0] Product slugs:", sampleProducts.map((p) => p.slug).join(", "))
  } catch (error) {
    console.error("[v0] Error seeding products:", error)
    throw error
  }
}

// Run the seed function
seedProducts()
  .then(() => {
    console.log("[v0] Seeding completed successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("[v0] Seeding failed:", error)
    process.exit(1)
  })
