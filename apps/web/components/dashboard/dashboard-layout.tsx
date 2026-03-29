import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Gavel, ShoppingCart } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  {
    label: "My Bids",
    href: "/dashboard/bids",
    icon: ShoppingCart,
  },
  {
    label: "My Auctions",
    href: "/dashboard/auctions",
    icon: Gavel,
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const currentPath = router.pathname;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <aside className="w-64 shrink-0 hidden md:block">
            <nav className="sticky top-24 space-y-2">
              <h2 className="text-lg font-semibold mb-4 px-3">Dashboard</h2>
              <Separator className="mb-4" />
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  variant={
                    currentPath.startsWith(item.href) ? "secondary" : "ghost"
                  }
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Link>
                </Button>
              ))}
            </nav>
          </aside>

          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
