import Hero from "../Components/Home/Hero";

import ProductsPage from "./ProductsPage";
export default function HomePage() {
  return (
    <main className="overflow-x-hidden">
      <Hero />
      <ProductsPage />
    </main>
  );
}
