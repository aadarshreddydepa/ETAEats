"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Package,
  Clock3,
  QrCode,
  ArrowRight,
  Utensils,
  Sparkles,
} from "lucide-react";
import { BrandMark } from "@/components/layout/BrandMark";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  SectionHeader,
  Spinner,
} from "@/components/ui";
import { useAuthStore } from "@/stores/auth.store";
import { useOrderTrackingStore } from "@/stores/orderTracking.store";
import api from "@/lib/api";
import type { Order, Paginated, OrderStatus } from "@/lib/api.types";

const LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY: "Ready",
  PICKED_UP: "Picked up",
  CANCELLED: "Cancelled",
};

const STATUS_TONE: Record<
  OrderStatus,
  "powder" | "cream" | "peach" | "mint" | "neutral" | "error"
> = {
  PENDING: "cream",
  CONFIRMED: "powder",
  PREPARING: "powder",
  READY: "peach",
  PICKED_UP: "mint",
  CANCELLED: "error",
};

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const { activeOrder, setActiveOrder } = useOrderTrackingStore();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) router.replace("/auth/login");
  }, [hasHydrated, isAuthenticated, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["orders", "home"],
    queryFn: () =>
      api.get<Paginated<Order>>("/orders/my/?page_size=8").then((r) => r.data),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!data?.results?.length) return;
    const live = data.results.find(
      (o) =>
        !['PICKED_UP', 'CANCELLED'].includes(o.status) &&
        !['UNPAID', 'FAILED'].includes(o.payment_status)
    );
    if (live) {
      setActiveOrder({
        id: live.id,
        restaurantName: live.restaurant_name,
        totalAmount: live.total_amount,
        createdAt: live.created_at,
        status: live.status,
      });
    }
  }, [data, setActiveOrder]);

  if (!hasHydrated || !isAuthenticated) return null;

  const firstName =
    (user?.full_name?.split(" ")[0] ?? "").trim() || "traveller";
  const recentOrders = data?.results?.slice(0, 4) ?? [];

  return (
    <div className="app-shell slux-fade-in">
      <div className="app-shell-inner pt-6 lg:pt-10">
        {/* Greeting — desktop only shows without BrandMark which sits in the rail */}
        <div className="flex items-center justify-between lg:hidden mb-6">
          <BrandMark size="sm" compact />
        </div>

        {/* Editorial hero */}
        <section>
          <p className="text-label text-text-muted">
            Good to see you, {firstName}
          </p>
          <h1 className="mt-3 text-h1 lg:text-display-l text-text-primary max-w-xl">
            Order food before your bus{" "}
            <span className="text-accent-ink-powder-blue">arrives.</span>
          </h1>
          <p className="mt-3 text-body lg:text-body-lg text-text-tertiary max-w-lg">
            Scan the QR inside your bus and pre-order from the assigned highway
            kitchen. We&rsquo;ll have it ready when you step off.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 max-w-xl">
            <Button size="lg" fullWidth onClick={() => router.push("/scan")}>
              <QrCode className="h-4 w-4" />
              Scan Bus QR
            </Button>
            <Button
              size="lg"
              variant="secondary"
              fullWidth
              onClick={() => router.push("/scan")}
            >
              Enter 6-digit code
            </Button>
          </div>
        </section>

        {/* Live order card */}
        {activeOrder && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8"
          >
            <Card
              as="button"
              tone="powder"
              padding="md"
              radius="card"
              shadow="e2"
              interactive
              bordered={false}
              onClick={() => router.push(`/order/${activeOrder.id}`)}
              className="w-full"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-label text-accent-ink-powder-blue">
                    Active order
                  </p>
                  <p className="mt-2 text-h3 text-text-primary truncate">
                    {activeOrder.restaurantName}
                  </p>
                  <p className="mt-1 text-body-sm text-text-tertiary">
                    #{activeOrder.id.slice(0, 8)} · ₹{activeOrder.totalAmount}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="neutral" size="md" dot>
                    {LABEL[activeOrder.status]}
                  </Badge>
                  <span className="inline-flex items-center gap-1 text-body-sm text-accent-ink-powder-blue font-semibold">
                    Track <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Features strip — desktop */}
        <section className="mt-10 hidden lg:grid grid-cols-3 gap-4">
          <Card tone="default" padding="lg" radius="card" shadow="e1">
            <div className="h-10 w-10 rounded-lg bg-accent-muted-mint flex items-center justify-center">
              <Utensils className="h-5 w-5 text-accent-ink-muted-mint" />
            </div>
            <p className="mt-4 text-h4 text-text-primary">Route-aware menus</p>
            <p className="mt-1.5 text-body-sm text-text-tertiary">
              Only the kitchen assigned to your bus, nothing else.
            </p>
          </Card>
          <Card tone="default" padding="lg" radius="card" shadow="e1">
            <div className="h-10 w-10 rounded-lg bg-accent-soft-cream flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-accent-ink-soft-cream" />
            </div>
            <p className="mt-4 text-h4 text-text-primary">Ready on arrival</p>
            <p className="mt-1.5 text-body-sm text-text-tertiary">
              Your food is prepped in sync with your ETA.
            </p>
          </Card>
          <Card tone="default" padding="lg" radius="card" shadow="e1">
            <div className="h-10 w-10 rounded-lg bg-accent-peach flex items-center justify-center">
              <Clock3 className="h-5 w-5 text-accent-ink-peach" />
            </div>
            <p className="mt-4 text-h4 text-text-primary">Skip the queue</p>
            <p className="mt-1.5 text-body-sm text-text-tertiary">
              Pay once on your phone. Walk up and grab it.
            </p>
          </Card>
        </section>

        {/* Recent orders */}
        <section className="mt-10">
          <SectionHeader
            eyebrow="History"
            title="Recent orders"
            action={
              recentOrders.length > 0 && (
                <Link
                  href="/orders"
                  className="text-body-sm font-semibold text-text-primary hover:underline underline-offset-4"
                >
                  View all
                </Link>
              )
            }
          />

          {isLoading && (
            <div className="flex justify-center py-10">
              <Spinner className="h-6 w-6" />
            </div>
          )}

          {!isLoading && recentOrders.length === 0 && (
            <Card tone="sunk" padding="lg" radius="card" bordered shadow="none">
              <EmptyState
                icon={<Package className="h-6 w-6" />}
                title="No orders yet"
                description="Your first pre-order will appear here. Scan a bus QR to get started."
                tone="neutral"
              />
            </Card>
          )}

          <div className="grid gap-3 lg:grid-cols-2">
            {recentOrders.map((order) => (
              <Card
                key={order.id}
                as="button"
                tone="default"
                padding="md"
                radius="card"
                shadow="e1"
                interactive
                onClick={() => router.push(`/order/${order.id}`)}
                className="w-full"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-h4 text-text-primary truncate">
                      {order.restaurant_name}
                    </p>
                    <p className="text-caption text-text-muted mt-0.5">
                      #{order.id.slice(0, 8)} ·{" "}
                      {new Date(order.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <Badge variant={STATUS_TONE[order.status]} size="sm">
                    {LABEL[order.status]}
                  </Badge>
                </div>
                <p className="mt-3 text-body-sm text-text-tertiary line-clamp-1">
                  {order.items
                    .slice(0, 3)
                    .map((i) => i.menu_item_name)
                    .join(" · ")}
                </p>
                <p className="mt-3 text-h4 text-text-primary">
                  ₹{order.total_amount}
                </p>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
