import { fetchCatalogProducts } from "@/lib/supabase/services/products";
import { fetchCategories } from "@/lib/supabase/services/categories";
import { KatalogClient } from "@/components/katalog/katalog-client";

export const revalidate = 0;

export default async function KatalogPage() {
  const [initialProducts, initialCategories] = await Promise.all([
    fetchCatalogProducts(),
    fetchCategories(true),
  ]);

  return (
    <KatalogClient
      initialProducts={initialProducts}
      initialCategories={initialCategories}
    />
  );
}
