"use client";

/**
 * lib/contexts/cart-context.tsx
 * Global cart state for Pea Ice Cream.
 * Supports products with dynamic multi-choice flavors (e.g. Scoop 1, Scoop 2)
 * with individual price adjustments and deduplication rules.
 * Persisted to localStorage so it survives page reloads.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CartFlavorChoice {
  choiceIndex: number; // 1, 2, ...
  choiceLabel: string; // e.g. "Scoop 1", "Scoop 2"
  flavorId: string;
  flavorName: string;
  extraPrice: number;
}

export interface CartItem {
  /** Unique ID of the product (from catalog) */
  productId: string;
  /** Display name of the product */
  name: string;
  /** Whether this product uses multi-flavor selection */
  hasFlavorSelection?: boolean;
  /** Structured flavor choices snapshot */
  flavorChoices?: CartFlavorChoice[];
  /** Name of the choice unit, e.g. "Scoop" */
  flavorChoiceLabel?: string;
  /**
   * Flavor combination array (kept for backward compatibility & display)
   * e.g. ["Vanilla Dream", "Chocolate Fudge"]
   */
  flavorCombo: string[];
  /** Cup size key: "small" | "medium" | "large" */
  size: "small" | "medium" | "large";
  /** Number of items ordered */
  quantity: number;
  /** Base price of the product */
  basePrice?: number;
  /** Total price per item in IDR (basePrice + sum(extraPrice)) */
  price: number;
  /** Optional free-text notes */
  notes?: string;
  /** Maximum available stock */
  maxStock: number;
}

/** Derived unique cart item key used for deduplication & identity */
export function itemKey(
  item: Pick<CartItem, "productId" | "size" | "flavorCombo" | "flavorChoices" | "hasFlavorSelection">
): string {
  if (item.hasFlavorSelection && item.flavorChoices && item.flavorChoices.length > 0) {
    // Sort by flavorId so clicking order does NOT create different combinations.
    // Chocolate + Strawberry is identical to Strawberry + Chocolate.
    const sortedFlavorIds = item.flavorChoices
      .map((c) => c.flavorId)
      .slice()
      .sort()
      .join("|");
    return `${item.productId}__mix:${sortedFlavorIds}`;
  }
  return `${item.productId}__${item.size}__${(item.flavorCombo || []).slice().sort().join("+")}`;
}

// ─── State & Actions ─────────────────────────────────────────────────────────

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { key: string } }
  | { type: "UPDATE_QUANTITY"; payload: { key: string; quantity: number } }
  | { type: "UPDATE_ITEM"; payload: { oldKey: string; updatedItem: CartItem } }
  | { type: "CLEAR_CART" }
  | { type: "HYDRATE"; payload: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return { items: action.payload };

    case "ADD_ITEM": {
      const key = itemKey(action.payload);
      const existingIndex = state.items.findIndex((i) => itemKey(i) === key);

      if (existingIndex !== -1) {
        // Same product & same flavor combination: increment quantity
        const existing = state.items[existingIndex];
        const newQty = Math.min(
          existing.quantity + action.payload.quantity,
          existing.maxStock
        );
        const updated = [...state.items];
        updated[existingIndex] = { ...existing, quantity: newQty };
        return { items: updated };
      }
      // Different flavor combination or new product: add as separate item
      return { items: [...state.items, action.payload] };
    }

    case "REMOVE_ITEM":
      return {
        items: state.items.filter((i) => itemKey(i) !== action.payload.key),
      };

    case "UPDATE_QUANTITY": {
      if (action.payload.quantity <= 0) {
        return {
          items: state.items.filter((i) => itemKey(i) !== action.payload.key),
        };
      }
      return {
        items: state.items.map((i) => {
          if (itemKey(i) !== action.payload.key) return i;
          const newQty = Math.min(action.payload.quantity, i.maxStock);
          return { ...i, quantity: newQty };
        }),
      };
    }

    case "UPDATE_ITEM": {
      const { oldKey, updatedItem } = action.payload;
      const targetIndex = state.items.findIndex((i) => itemKey(i) === oldKey);
      if (targetIndex === -1) return state;

      const newKey = itemKey(updatedItem);
      // If new choices match another existing item, merge them
      const mergeIndex = state.items.findIndex(
        (i, idx) => idx !== targetIndex && itemKey(i) === newKey
      );

      if (mergeIndex !== -1) {
        const mergedItems = [...state.items];
        const target = mergedItems[targetIndex];
        const destination = mergedItems[mergeIndex];
        mergedItems[mergeIndex] = {
          ...destination,
          quantity: Math.min(destination.quantity + target.quantity, destination.maxStock),
        };
        // Remove old item
        return { items: mergedItems.filter((_, idx) => idx !== targetIndex) };
      }

      const updated = [...state.items];
      updated[targetIndex] = updatedItem;
      return { items: updated };
    }

    case "CLEAR_CART":
      return { items: [] };

    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (item: CartItem | Pick<CartItem, "productId" | "size" | "flavorCombo" | "flavorChoices" | "hasFlavorSelection">) => void;
  updateQuantity: (
    item: CartItem | Pick<CartItem, "productId" | "size" | "flavorCombo" | "flavorChoices" | "hasFlavorSelection">,
    quantity: number
  ) => void;
  updateItemChoices: (oldKey: string, updatedItem: CartItem) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "pea_cart_v2";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  /* Hydrate from localStorage once on mount */
  useEffect(() => {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // Try v1 fallback
        raw = localStorage.getItem("pea_cart_v1");
      }
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) {
          dispatch({ type: "HYDRATE", payload: parsed });
        }
      }
    } catch {
      // Silently ignore corrupt storage
    }
  }, []);

  /* Persist to localStorage on every change */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // Storage might be full or unavailable
    }
  }, [state.items]);

  const addItem = useCallback((item: CartItem) => {
    dispatch({ type: "ADD_ITEM", payload: item });
  }, []);

  const removeItem = useCallback(
    (item: CartItem | Pick<CartItem, "productId" | "size" | "flavorCombo" | "flavorChoices" | "hasFlavorSelection">) => {
      dispatch({ type: "REMOVE_ITEM", payload: { key: itemKey(item) } });
    },
    []
  );

  const updateQuantity = useCallback(
    (
      item: CartItem | Pick<CartItem, "productId" | "size" | "flavorCombo" | "flavorChoices" | "hasFlavorSelection">,
      quantity: number
    ) => {
      dispatch({
        type: "UPDATE_QUANTITY",
        payload: { key: itemKey(item), quantity },
      });
    },
    []
  );

  const updateItemChoices = useCallback((oldKey: string, updatedItem: CartItem) => {
    dispatch({
      type: "UPDATE_ITEM",
      payload: { oldKey, updatedItem },
    });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
  }, []);

  const totalItems = useMemo(
    () => state.items.reduce((sum, i) => sum + i.quantity, 0),
    [state.items]
  );

  const totalPrice = useMemo(
    () => state.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [state.items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      addItem,
      removeItem,
      updateQuantity,
      updateItemChoices,
      clearCart,
      totalItems,
      totalPrice,
    }),
    [state.items, addItem, removeItem, updateQuantity, updateItemChoices, clearCart, totalItems, totalPrice]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside <CartProvider>");
  }
  return ctx;
}
