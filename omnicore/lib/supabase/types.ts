// lib/supabase/types.ts
//
// Hand-written to match supabase/schema.sql. If you change the schema,
// update this file too (or generate it properly later with:
//   npx supabase gen types typescript --project-id <your-project-id>
// once you have the Supabase CLI set up).

export type Database = {
  public: {
    Tables: {
      vendors: {
        Row: {
          id: string;
          slug: string;
          name: string;
          tagline: string | null;
          location: string | null;
          color: "marigold" | "jade" | "coral" | "sky";
          whatsapp: string;
          rating: number;
          followers: number;
          created_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          name: string;
          tagline?: string | null;
          location?: string | null;
          color?: "marigold" | "jade" | "coral" | "sky";
          whatsapp: string;
          rating?: number;
          followers?: number;
        };
        Update: Partial<Database["public"]["Tables"]["vendors"]["Insert"]>;
      };
      products: {
        Row: {
          id: string;
          vendor_id: string;
          title: string;
          price: number;
          compare_at: number | null;
          category: string;
          image_url: string;
          stock_left: number;
          live_viewers: number;
          sold_today: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          title: string;
          price: number;
          compare_at?: number | null;
          category?: string;
          image_url: string;
          stock_left?: number;
          live_viewers?: number;
          sold_today?: number;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      reels: {
        Row: {
          id: string;
          vendor_id: string;
          product_id: string | null;
          caption: string;
          video_url: string | null;
          poster_url: string;
          is_live: boolean;
          likes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          product_id?: string | null;
          caption?: string;
          video_url?: string | null;
          poster_url: string;
          is_live?: boolean;
          likes?: number;
        };
        Update: Partial<Database["public"]["Tables"]["reels"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          vendor_id: string;
          product_id: string | null;
          order_ref: string;
          customer_name: string;
          customer_phone: string;
          amount: number;
          status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
          transport_company: string | null;
          departure_terminal: string | null;
          driver_name: string | null;
          driver_phone: string | null;
          waybill_code: string | null;
          shipped_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          product_id?: string | null;
          order_ref?: string;
          customer_name: string;
          customer_phone: string;
          amount: number;
          status?: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
