// lib/supabase/types.ts
//
// Hand-written to match supabase/schema.sql (plus social extension).
// If you change the schema, update this file too (or generate it properly
// later with: npx supabase gen types typescript --project-id <your-project-id>)

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
          is_verified: boolean;
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
          is_verified?: boolean;
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

      /* Social/Community extension */
      vendor_follows: {
        Row: {
          follower_id: string;
          vendor_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          vendor_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["vendor_follows"]["Insert"]>;
      };

      social_posts: {
        Row: {
          id: string;
          vendor_id: string;
          product_id: string | null;
          order_id: string | null;
          kind: "product_drop" | "shipped" | "restock" | "reel";
          body: string;
          media_url: string | null;
          route_label: string | null;
          depth_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          product_id?: string | null;
          order_id?: string | null;
          kind?: "product_drop" | "shipped" | "restock" | "reel";
          body: string;
          media_url?: string | null;
          route_label?: string | null;
          depth_score?: number;
        };
        Update: Partial<Database["public"]["Tables"]["social_posts"]["Insert"]>;
      };

      social_comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["social_comments"]["Insert"]>;
      };

      social_reactions: {
        Row: {
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["social_reactions"]["Insert"]>;
      };

      vendor_spaces: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          category: string;
          privacy: "public" | "invite_only";
          is_live: boolean;
          live_channel: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
          category?: string;
          privacy?: "public" | "invite_only";
          is_live?: boolean;
          live_channel?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["vendor_spaces"]["Insert"]>;
      };

      creator_support: {
        Row: {
          id: string;
          supporter_id: string;
          vendor_id: string;
          amount: number;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          supporter_id: string;
          vendor_id: string;
          amount: number;
          note?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["creator_support"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
