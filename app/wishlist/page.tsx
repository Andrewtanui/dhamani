"use client";

import { useWishlist } from "@/hooks/useWishlist";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ExternalLinkIcon,
  ShoppingBagIcon,
  TrashIcon,
  HeartIcon,
} from "lucide-react";
import type { RetailerName } from "@/types";

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

export default function WishlistPage() {
  const { items, removeFromWishlist, loading } = useWishlist();

  const WishlistItem = ({ item }: { item: any }) => {
    const config = RETAILER_CONFIG[item.retailer as RetailerName];

    return (
      <Card className="h-full flex flex-col card-hover group overflow-hidden border-border/50">
        {item.product_image_url && (
          <div className="aspect-square w-full overflow-hidden bg-muted relative">
            <img
              src={item.product_image_url}
              alt={item.product_name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeFromWishlist(item.product_url)}
              className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm hover:bg-background text-red-500"
            >
              <TrashIcon className="h-5 w-5" />
            </Button>
          </div>
        )}
        {!item.product_image_url && (
          <div className="aspect-square w-full bg-muted relative flex items-center justify-center">
            <HeartIcon className="h-12 w-12 text-muted-foreground/50" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeFromWishlist(item.product_url)}
              className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm hover:bg-background text-red-500"
            >
              <TrashIcon className="h-5 w-5" />
            </Button>
          </div>
        )}
        <CardHeader className="flex-1">
          <CardTitle className="line-clamp-2 text-base group-hover:text-primary transition-colors">
            {item.product_name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-baseline gap-2">
            {item.product_price != null && (
              <span className="text-2xl font-bold gradient-text">
                KES {item.product_price.toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span
              className={`capitalize font-medium ${config.color} ${config.bg} px-2 py-0.5 rounded-full`}
            >
              {item.retailer}
            </span>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            asChild
            className="w-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
          >
            <a
              href={item.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ExternalLinkIcon className="h-4 w-4" />
              View on {item.retailer}
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
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Your <span className="gradient-text">Wishlist</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Save your favorite products and come back to them later
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <WishlistItem key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <ShoppingBagIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">
              Your wishlist is empty
            </h3>
            <p className="text-muted-foreground max-w-md mb-8">
              Start exploring products and save your favorites!
            </p>
            <Button
              asChild
              size="lg"
              className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
              <a href="/">Explore Products</a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
