import { Button } from "@/components/ui/button";
import { Gavel, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between mx-auto">
          <div className="flex items-center gap-2">
            <Gavel className="h-6 w-6" />
            <span className="text-xl font-bold">GoonAuctions</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/' ? '' : 'text-muted-foreground'}`}>
              Home
            </Link>
            <Link href="/auctions" className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/auctions' ? '' : 'text-muted-foreground'}`}>
              Auctions
            </Link>
            <Link href="/categories" className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/categories' ? '' : 'text-muted-foreground'}`}>
              Categories
            </Link>
            <Link href="/how-it-works" className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/how-it-works' ? '' : 'text-muted-foreground'}`}>
              How It Works
            </Link>
            <Link href="/about-us" className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/about-us' ? '' : 'text-muted-foreground'}`}>
              About Us
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
            <Button>Sign Up</Button>
            <Button variant="outline" className="hidden md:inline-flex">
              Log In
            </Button>
          </div>
        </div>
      </header>
  )
}
