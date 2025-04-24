import { Button } from "@/components/ui/button";
import { Gavel, Search } from "lucide-react";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between mx-auto">
          <div className="flex items-center gap-2">
            <Gavel className="h-6 w-6" />
            <span className="text-xl font-bold">GoonAuctions</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
              Home
            </Link>
            <Link href="auctions" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Auctions
            </Link>
            <Link href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Categories
            </Link>
            <Link href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              How It Works
            </Link>
            <Link href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
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
