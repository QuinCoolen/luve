import { Button } from "@/components/ui/button";
import { Gavel, Search, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthContext } from "@/context/auth";
import { useContext } from "react";
import { userService } from "@/services/api";

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useContext(AuthContext);

  const handleLogout = async () => {
    await userService.logout();
    logout();
  };

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
            {user ? (
              <>
                <p className="text-sm font-medium capitalize">Welcome, {user.username}</p>
                <Button variant="outline" size="icon" className="hidden md:flex" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                  <span className="sr-only">Log Out</span>
                </Button>
              </>
            ) : (
              <>
                <Button variant="default" className="hidden md:inline-flex" asChild>
                  <Link href="/register">Sign Up</Link>
                </Button>
                <Button variant="outline" className="hidden md:inline-flex" asChild>
                  <Link href="/login">Log In</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
  )
}
