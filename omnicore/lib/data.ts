export type Product = {
  id: string;
  title: string;
  price: number;
  compareAt?: number;
  vendorSlug: string;
  category: string;
  image: string;
  liveViewers: number;
  soldToday: number;
  stockLeft: number;
};

export type Vendor = {
  slug: string;
  name: string;
  tagline: string;
  location: string;
  color: "marigold" | "jade" | "coral" | "sky";
  rating: number;
  followers: number;
};

export type Reel = {
  id: string;
  vendorSlug: string;
  productId: string;
  caption: string;
  poster: string;
  likes: number;
  isLive?: boolean;
};

export const vendors: Vendor[] = [
  {
    slug: "adaeze-leather",
    name: "Adaeze Leather Co.",
    tagline: "Handmade footwear out of Aba",
    location: "Aba, Abia",
    color: "coral",
    rating: 4.8,
    followers: 12400,
  },
  {
    slug: "lagos-fit",
    name: "Lagos Fit Studio",
    tagline: "Athleisure for the Lagos hustle",
    location: "Lekki, Lagos",
    color: "sky",
    rating: 4.6,
    followers: 8900,
  },
  {
    slug: "market-fresh",
    name: "Market Fresh Spices",
    tagline: "Pepper, spice blends & smoked stock",
    location: "Onitsha, Anambra",
    color: "jade",
    rating: 4.9,
    followers: 21000,
  },
  {
    slug: "kaduna-textiles",
    name: "Kaduna Textiles",
    tagline: "Ankara and adire by the yard",
    location: "Kaduna",
    color: "marigold",
    rating: 4.7,
    followers: 5600,
  },
];

export const products: Product[] = [
  {
    id: "p1",
    title: "Oxford Leather Loafers",
    price: 28500,
    compareAt: 36000,
    vendorSlug: "adaeze-leather",
    category: "Footwear",
    image: "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600",
    liveViewers: 14,
    soldToday: 5,
    stockLeft: 6,
  },
  {
    id: "p2",
    title: "Woven Belt — Tan",
    price: 6200,
    vendorSlug: "adaeze-leather",
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600",
    liveViewers: 3,
    soldToday: 2,
    stockLeft: 19,
  },
  {
    id: "p3",
    title: "Compression Leggings",
    price: 9800,
    compareAt: 13500,
    vendorSlug: "lagos-fit",
    category: "Activewear",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600",
    liveViewers: 22,
    soldToday: 11,
    stockLeft: 4,
  },
  {
    id: "p4",
    title: "Smoked Cat Fish (1kg)",
    price: 11000,
    vendorSlug: "market-fresh",
    category: "Food & Spice",
    image: "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=600",
    liveViewers: 8,
    soldToday: 17,
    stockLeft: 30,
  },
  {
    id: "p5",
    title: "House Pepper Mix — 500g",
    price: 4200,
    vendorSlug: "market-fresh",
    category: "Food & Spice",
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600",
    liveViewers: 5,
    soldToday: 9,
    stockLeft: 42,
  },
  {
    id: "p6",
    title: "Adire Wrapper — 2 Yards",
    price: 15500,
    vendorSlug: "kaduna-textiles",
    category: "Fabric",
    image: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=600",
    liveViewers: 11,
    soldToday: 3,
    stockLeft: 8,
  },
];

export const reels: Reel[] = [
  {
    id: "r1",
    vendorSlug: "adaeze-leather",
    productId: "p1",
    caption: "Hand-stitching the loafer sole — 6 pairs left in stock 🔥",
    poster: "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800",
    likes: 3200,
  },
  {
    id: "r2",
    vendorSlug: "lagos-fit",
    productId: "p3",
    caption: "LIVE: restock drop happening now, first 10 orders get free waybill",
    poster: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
    likes: 980,
    isLive: true,
  },
  {
    id: "r3",
    vendorSlug: "market-fresh",
    productId: "p4",
    caption: "Smoking the catfish the Onitsha way — order before 5pm for same-day park dispatch",
    poster: "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=800",
    likes: 5400,
  },
  {
    id: "r4",
    vendorSlug: "kaduna-textiles",
    productId: "p6",
    caption: "New adire pattern just landed — swipe to see it styled 3 ways",
    poster: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=800",
    likes: 1560,
  },
];

export function getVendor(slug: string) {
  return vendors.find((v) => v.slug === slug);
}

export function getProductsForVendor(slug: string) {
  return products.filter((p) => p.vendorSlug === slug);
}

export function searchCatalog(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      getVendor(p.vendorSlug)?.name.toLowerCase().includes(q)
  );
}
