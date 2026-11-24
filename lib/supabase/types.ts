export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CupSize = "small" | "medium" | "large";
export type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "verified";
export type DeliveryMethod = "delivery" | "pickup";
export type PaymentMethodType = "transfer" | "qris";
export type AdminRole = "admin" | "superadmin";

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          user_id: string;
          email: string;
          full_name: string;
          role: AdminRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email: string;
          full_name?: string;
          role?: AdminRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          email?: string;
          full_name?: string;
          role?: AdminRole;
          created_at?: string;
          updated_at?: string;
        };
      };
      store_settings: {
        Row: {
          id: string;
          business_name: string;
          tagline_primary: string;
          taglines: string[];
          pending_verification_tagline: string;
          description: string;
          whatsapp_number: string;
          instagram: string;
          tiktok: string;
          address: string;
          city: string;
          business_hours: Json;
          logo_url: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_name: string;
          tagline_primary?: string;
          taglines?: string[];
          pending_verification_tagline?: string;
          description?: string;
          whatsapp_number?: string;
          instagram?: string;
          tiktok?: string;
          address?: string;
          city?: string;
          business_hours?: Json;
          logo_url?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_name?: string;
          tagline_primary?: string;
          taglines?: string[];
          pending_verification_tagline?: string;
          description?: string;
          whatsapp_number?: string;
          instagram?: string;
          tiktok?: string;
          address?: string;
          city?: string;
          business_hours?: Json;
          logo_url?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      banners: {
        Row: {
          id: string;
          order_idx: number;
          is_active: boolean;
          title: string;
          subtitle: string;
          cta_text: string;
          cta_link: string;
          badge: string | null;
          bg_theme: string;
          image_desktop: string;
          image_mobile: string | null;
          image_alt: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_idx?: number;
          is_active?: boolean;
          title: string;
          subtitle: string;
          cta_text: string;
          cta_link: string;
          badge?: string | null;
          bg_theme?: string;
          image_desktop: string;
          image_mobile?: string | null;
          image_alt: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_idx?: number;
          is_active?: boolean;
          title?: string;
          subtitle?: string;
          cta_text?: string;
          cta_link?: string;
          badge?: string | null;
          bg_theme?: string;
          image_desktop?: string;
          image_mobile?: string | null;
          image_alt?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          order_idx: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          order_idx?: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          order_idx?: number;
          is_active?: boolean;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          category_slug: string;
          allergens: string[];
          images: string[];
          is_available: boolean;
          is_bestseller: boolean;
          is_new: boolean;
          is_archived: boolean;
          base_price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug?: string;
          description?: string;
          category_slug?: string;
          allergens?: string[];
          images?: string[];
          is_available?: boolean;
          is_bestseller?: boolean;
          is_new?: boolean;
          is_archived?: boolean;
          base_price?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string;
          category_slug?: string;
          allergens?: string[];
          images?: string[];
          is_available?: boolean;
          is_bestseller?: boolean;
          is_new?: boolean;
          is_archived?: boolean;
          base_price?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_flavors: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          slug: string;
          is_active: boolean;
          order_idx: number;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          slug?: string;
          is_active?: boolean;
          order_idx?: number;
        };
        Update: {
          id?: string;
          product_id?: string;
          name?: string;
          slug?: string;
          is_active?: boolean;
          order_idx?: number;
        };
      };
      product_sizes: {
        Row: {
          id: string;
          product_id: string;
          size: CupSize;
          price: number;
          allow_mix_flavors: boolean;
        };
        Insert: {
          id?: string;
          product_id: string;
          size: CupSize;
          price: number;
          allow_mix_flavors?: boolean;
        };
        Update: {
          id?: string;
          product_id?: string;
          size?: CupSize;
          price?: number;
          allow_mix_flavors?: boolean;
        };
      };
      inventory: {
        Row: {
          id: string;
          product_id: string;
          flavor_id: string;
          size: CupSize;
          quantity: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          flavor_id: string;
          size: CupSize;
          quantity?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          flavor_id?: string;
          size?: CupSize;
          quantity?: number;
          updated_at?: string;
        };
      };
      stock_logs: {
        Row: {
          id: string;
          inventory_id: string;
          change_amount: number;
          reason: string;
          order_id: string | null;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          inventory_id: string;
          change_amount: number;
          reason: string;
          order_id?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          inventory_id?: string;
          change_amount?: number;
          reason?: string;
          order_id?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
      };
      delivery_zones: {
        Row: {
          id: string;
          name: string;
          fee_range: string;
          notes: string | null;
          order_idx: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          fee_range: string;
          notes?: string | null;
          order_idx?: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          fee_range?: string;
          notes?: string | null;
          order_idx?: number;
          is_active?: boolean;
        };
      };
      payment_methods: {
        Row: {
          id: string;
          type: PaymentMethodType;
          bank_name: string | null;
          account_number: string | null;
          account_name: string | null;
          qris_image_url: string | null;
          instructions: string | null;
          is_active: boolean;
          order_idx: number;
        };
        Insert: {
          id?: string;
          type: PaymentMethodType;
          bank_name?: string | null;
          account_number?: string | null;
          account_name?: string | null;
          qris_image_url?: string | null;
          instructions?: string | null;
          is_active?: boolean;
          order_idx?: number;
        };
        Update: {
          id?: string;
          type?: PaymentMethodType;
          bank_name?: string | null;
          account_number?: string | null;
          account_name?: string | null;
          qris_image_url?: string | null;
          instructions?: string | null;
          is_active?: boolean;
          order_idx?: number;
        };
      };
      external_delivery_apps: {
        Row: {
          id: string;
          name: string;
          url: string;
          icon: string | null;
          is_active: boolean;
          order_idx: number;
        };
        Insert: {
          id?: string;
          name: string;
          url: string;
          icon?: string | null;
          is_active?: boolean;
          order_idx?: number;
        };
        Update: {
          id?: string;
          name?: string;
          url?: string;
          icon?: string | null;
          is_active?: boolean;
          order_idx?: number;
        };
      };
      orders: {
        Row: {
          id: string;
          ref: string;
          idempotency_key: string | null;
          customer_name: string;
          customer_phone: string;
          delivery_method: DeliveryMethod;
          delivery_address: string;
          address_landmark: string | null;
          payment_method: PaymentMethodType;
          order_notes: string | null;
          subtotal: number;
          delivery_fee: number | null;
          total_amount: number;
          order_status: OrderStatus;
          payment_status: PaymentStatus;
          stock_deducted: boolean;
          guest_token_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ref: string;
          idempotency_key?: string | null;
          customer_name: string;
          customer_phone: string;
          delivery_method: DeliveryMethod;
          delivery_address: string;
          address_landmark?: string | null;
          payment_method: PaymentMethodType;
          order_notes?: string | null;
          subtotal: number;
          delivery_fee?: number | null;
          total_amount: number;
          order_status?: OrderStatus;
          payment_status?: PaymentStatus;
          stock_deducted?: boolean;
          guest_token_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ref?: string;
          idempotency_key?: string | null;
          customer_name?: string;
          customer_phone?: string;
          delivery_method?: DeliveryMethod;
          delivery_address?: string;
          address_landmark?: string | null;
          payment_method?: PaymentMethodType;
          order_notes?: string | null;
          subtotal?: number;
          delivery_fee?: number | null;
          total_amount?: number;
          order_status?: OrderStatus;
          payment_status?: PaymentStatus;
          stock_deducted?: boolean;
          guest_token_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name_snapshot: string;
          flavor_snapshot: string[];
          size: CupSize;
          unit_price: number;
          quantity: number;
          subtotal: number;
          notes: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name_snapshot: string;
          flavor_snapshot: string[];
          size: CupSize;
          unit_price: number;
          quantity: number;
          subtotal: number;
          notes?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_name_snapshot?: string;
          flavor_snapshot?: string[];
          size?: CupSize;
          unit_price?: number;
          quantity?: number;
          subtotal?: number;
          notes?: string | null;
        };
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          from_status: OrderStatus | null;
          to_status: OrderStatus;
          note: string | null;
          changed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          from_status?: OrderStatus | null;
          to_status: OrderStatus;
          note?: string | null;
          changed_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          from_status?: OrderStatus | null;
          to_status?: OrderStatus;
          note?: string | null;
          changed_by?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
