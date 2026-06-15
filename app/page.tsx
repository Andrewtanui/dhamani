"use client";

import { useState } from "react";
import { useSearch } from "@/hooks/useSearch";
import { useWishlist } from "@/hooks/useWishlist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SearchIcon,
  ExternalLinkIcon,
  ShoppingBagIcon,
  TrendingUpIcon,
  ShieldIcon,
  ZapIcon,
  HeartIcon,
} from "lucide-react";
import type { ScrapedProduct, RetailerName } from "@/types";

const RETAILER_CONFIG: Record<
  RetailerName,
  { color: string; bg: string; label: string }
> = {
  jumia: { color: "text-orange-500", bg: "bg-orange-500/10", label: "Jumia" },
  kilimall: { color: "text-blue-500", bg: "bg-blue-500/10", label: "Kilimall" },
  jiji: { color: "text-green-500", bg: "bg-green-500/10", label: "Jiji" },
  instagram: {
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    label: "Instagram",
  },
};

export default function Home() {
  const {
    search,
    clear,
    data,
    loading,
    error,
    selectedRetailers,
    toggleRetailer,
    selectAllRetailers,
    ALL_RETAILERS,
  } = useSearch();
  const { items, addToWishlist, removeFromWishlist, isInWishlist } =
    useWishlist();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      search(query);
    }
  };

  const handleRetailerToggle = (retailer: RetailerName) => {
    let newRetailers: RetailerName[];
    if (selectedRetailers.includes(retailer)) {
      newRetailers = selectedRetailers.filter((r) => r !== retailer);
      if (newRetailers.length === 0) {
        newRetailers = ALL_RETAILERS;
      }
    } else {
      newRetailers = [...selectedRetailers, retailer];
    }
    toggleRetailer(retailer);
    if (query.trim() && data) {
      search(query, newRetailers);
    }
  };

  const ProductCard = ({ product }: { product: ScrapedProduct }) => {
    const config = RETAILER_CONFIG[product.retailer];
    const inWishlist = isInWishlist(product.url);

    const handleWishlistToggle = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (inWishlist) {
        removeFromWishlist(product.url);
      } else {
        addToWishlist(product);
      }
    };

    return (
      <Card className="h-full flex flex-col card-hover group overflow-hidden border-border/50">
        <div className="aspect-square w-full overflow-hidden bg-muted relative">
          {product.image_url && (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}
          {product.discount_pct && (
            <div className="absolute top-2 right-2 bg-gradient-to-r from-primary to-accent text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              -{product.discount_pct}%
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleWishlistToggle}
            className={`absolute top-2 left-2 bg-background/80 backdrop-blur-sm hover:bg-background ${inWishlist ? "text-red-500" : "text-muted-foreground"}`}
          >
            <HeartIcon
              className={`h-5 w-5 ${inWishlist ? "fill-current" : ""}`}
            />
          </Button>
        </div>
        <CardHeader className="flex-1">
          <CardTitle className="line-clamp-2 text-base group-hover:text-primary transition-colors">
            {product.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-baseline gap-2">
            {product.price != null && (
              <span className="text-2xl font-bold gradient-text">
                KES {product.price.toLocaleString()}
              </span>
            )}
            {product.original_price != null &&
              product.price != null &&
              product.original_price > product.price && (
                <span className="text-sm text-muted-foreground line-through">
                  KES {product.original_price.toLocaleString()}
                </span>
              )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span
              className={`capitalize font-medium ${config.color} ${config.bg} px-2 py-0.5 rounded-full`}
            >
              {product.retailer}
            </span>
            {product.rating && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ZapIcon className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  {product.rating}
                </span>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            asChild
            className="w-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
          >
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ExternalLinkIcon className="h-4 w-4" />
              View on {product.retailer}
            </a>
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const ProductSkeleton = () => (
    <Card className="h-full flex flex-col border-border/50">
      <Skeleton className="aspect-square w-full" />
      <CardHeader>
        <Skeleton className="h-5 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-1/4" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-bg opacity-50" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4 animate-fade-in">
              <TrendingUpIcon className="h-4 w-4" />
              <span>Compare prices across Jumia, Kilimall & Jiji</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight animate-fade-in-up">
              Find the Best Deals in
              <span className="gradient-text"> Kenya</span>
            </h1>
            <p
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              Compare prices across multiple retailers and save money on every
              purchase. Smart shopping starts here.
            </p>

            {/* Features */}
            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 transition-colors">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <SearchIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Smart Search</h3>
                <p className="text-sm text-muted-foreground">
                  Find products instantly across all major retailers
                </p>
              </div>
              <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 transition-colors">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUpIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Price Comparison</h3>
                <p className="text-sm text-muted-foreground">
                  Compare prices to find the best deals
                </p>
              </div>
              <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 transition-colors">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShieldIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Trusted Retailers</h3>
                <p className="text-sm text-muted-foreground">
                  Shop from verified and reliable sellers
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="container mx-auto px-4 py-8 -mt-8 relative z-10">
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <div className="relative p-2 bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl shadow-primary/10">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for products (e.g., iPhone, Laptop, Shoes...)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-12 h-12 text-base border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-10 px-6 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
              {loading ? "Searching..." : "Search"}
            </Button>
            {data && (
              <Button
                type="button"
                variant="ghost"
                onClick={clear}
                className="h-10 px-4"
              >
                Clear
              </Button>
            )}
          </div>
        </form>

        {/* Retailer Filters */}
        <div className="max-w-2xl mx-auto mt-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-sm text-muted-foreground font-medium">
              Filter by:
            </span>
            {ALL_RETAILERS.map((retailer) => {
              const config = RETAILER_CONFIG[retailer];
              const isSelected = selectedRetailers.includes(retailer);
              return (
                <Button
                  key={retailer}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleRetailerToggle(retailer)}
                  className={`capitalize transition-all ${isSelected ? "shadow-md" : ""}`}
                >
                  {config.label}
                </Button>
              );
            })}
            {selectedRetailers.length !== ALL_RETAILERS.length && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  selectAllRetailers();
                  if (query.trim() && data) {
                    search(query);
                  }
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive animate-fade-in">
            {error}
          </div>
        )}

        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        )}

        {data && data.results.length > 0 && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Found{" "}
                <span className="font-semibold text-foreground">
                  {data.results.length}
                </span>{" "}
                results in{" "}
                <span className="font-semibold text-foreground">
                  {(data.duration_ms / 1000).toFixed(2)}s
                </span>
                {selectedRetailers.length < ALL_RETAILERS.length && (
                  <span className="ml-2">
                    • Showing from{" "}
                    {selectedRetailers
                      .map((r) => RETAILER_CONFIG[r].label)
                      .join(", ")}
                  </span>
                )}
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.results.map((product, index) => (
                <ProductCard
                  key={`${product.retailer}-${index}`}
                  product={product}
                />
              ))}
            </div>
          </>
        )}

        {data && data.results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <ShoppingBagIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">No products found</h3>
            <p className="text-muted-foreground max-w-md">
              Try searching for something else or check your spelling. We're
              constantly adding new products!
            </p>
          </div>
        )}

        {!data && !loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <SearchIcon className="h-10 w-10 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Start your search</h3>
            <p className="text-muted-foreground max-w-md">
              Enter a product name above to compare prices across multiple
              retailers and find the best deals.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
