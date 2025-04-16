"use client"

import { useState } from "react"
import Head from "next/head"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Gavel,
  Search,
  ShoppingBag,
  Clock,
  Award,
  Heart,
  ChevronRight,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react"

export default function Home() {
  const [activeAuction, setActiveAuction] = useState(0)

  const auctions = [
    {
      id: 1,
      title: "Vintage Rolex Watch",
      currentBid: "$4,250",
      timeLeft: "2 hours",
      image: "/images/watch.png?height=400&width=600",
      bids: 18,
    },
    {
      id: 2,
      title: "Modern Art Painting",
      currentBid: "$1,800",
      timeLeft: "4 hours",
      image: "/images/painting.png?height=400&width=600",
      bids: 12,
    },
    {
      id: 3,
      title: "Antique Furniture Set",
      currentBid: "$3,500",
      timeLeft: "1 day",
      image: "/images/furniture.png?height=400&width=600",
      bids: 24,
    },
  ]

  const categories = [
    {
      title: "Luxury Watches",
      description: "Discover premium timepieces from renowned brands worldwide",
      icon: <Clock className="h-10 w-10 mb-4" />,
      items: "2,450+",
    },
    {
      title: "Fine Art",
      description: "Explore paintings, sculptures, and collectibles from famous artists",
      icon: <Heart className="h-10 w-10 mb-4" />,
      items: "1,800+",
    },
    {
      title: "Antiques",
      description: "Browse rare antiques with historical significance and unique stories",
      icon: <Award className="h-10 w-10 mb-4" />,
      items: "3,200+",
    },
    {
      title: "Jewelry",
      description: "Find exquisite jewelry pieces from different eras and designers",
      icon: <ShoppingBag className="h-10 w-10 mb-4" />,
      items: "1,950+",
    },
  ]

  const testimonials = [
    {
      quote:
        "I found a rare vintage watch that I'd been searching for years. The bidding process was smooth and secure.",
      author: "Michael Thompson",
      role: "Watch Collector",
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      quote:
        "As an art dealer, I've used many auction platforms. This one offers the best experience and attracts serious buyers.",
      author: "Sarah Johnson",
      role: "Art Dealer",
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      quote: "The authentication process gives me confidence when bidding on high-value items. Highly recommended!",
      author: "David Chen",
      role: "Antique Collector",
      image: "/placeholder.svg?height=100&width=100",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Head>
        <title>Goon Auctions | Find Rare and Luxury Items</title>
        <meta
          name="description"
          content="Discover and bid on exclusive luxury items, antiques, art, and collectibles."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between mx-auto">
          <div className="flex items-center gap-2">
            <Gavel className="h-6 w-6" />
            <span className="text-xl font-bold">GoonAuctions</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="#" className="text-sm font-medium transition-colors hover:text-primary">
              Home
            </Link>
            <Link href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
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

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-24 lg:py-32 bg-muted overflow-hidden">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  Discover Rare Treasures at Your Fingertips
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Bid on exclusive luxury items, antiques, art, and collectibles from verified sellers around the world.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button size="lg" className="w-full sm:w-auto">
                    Explore Auctions
                  </Button>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    How It Works
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="relative overflow-hidden rounded-xl">
                  <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${activeAuction * 100}%)` }}
                  >
                    {auctions.map((auction, index) => (
                      <div key={auction.id} className="min-w-full">
                        <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                          <Image
                            src={auction.image || "/placeholder.svg"}
                            alt={auction.title}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                            <h3 className="text-xl font-bold">{auction.title}</h3>
                            <div className="flex justify-between items-center mt-2">
                              <div>
                                <p className="text-sm opacity-90">Current Bid</p>
                                <p className="text-lg font-bold">{auction.currentBid}</p>
                              </div>
                              <div>
                                <Badge variant="secondary" className="bg-white/20 hover:bg-white/30">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {auction.timeLeft} left
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center mt-4 gap-2">
                  {auctions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveAuction(index)}
                      className={`h-2 w-2 rounded-full ${
                        activeAuction === index ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                      aria-label={`View auction ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Explore Categories</h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Discover thousands of unique items across our popular categories
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
              {categories.map((category, index) => (
                <Card key={index} className="transition-all hover:shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center">{category.icon}</div>
                    <h3 className="text-xl font-bold mt-2">{category.title}</h3>
                    <p className="text-muted-foreground mt-2">{category.description}</p>
                    <p className="text-sm font-medium mt-4">{category.items} items</p>
                    <Button variant="link" className="mt-2">
                      Browse Category <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 md:py-24 bg-muted">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">What Our Customers Say</h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Hear from collectors and sellers who have found success on our platform
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-background">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="relative h-16 w-16 rounded-full overflow-hidden mb-4">
                        <Image
                          src={testimonial.image || "/placeholder.svg"}
                          alt={testimonial.author}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <p className="italic mb-4">"{testimonial.quote}"</p>
                      <h4 className="font-bold">{testimonial.author}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Ready to Find Your Next Treasure?
                </h2>
                <p className="text-muted-foreground md:text-xl">
                  Join thousands of collectors and enthusiasts. Sign up today and get access to exclusive auctions.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <div className="mr-2 h-4 w-4 rounded-full bg-primary"></div>
                    <span>Free account creation</span>
                  </li>
                  <li className="flex items-center">
                    <div className="mr-2 h-4 w-4 rounded-full bg-primary"></div>
                    <span>Verified sellers and secure transactions</span>
                  </li>
                  <li className="flex items-center">
                    <div className="mr-2 h-4 w-4 rounded-full bg-primary"></div>
                    <span>Expert authentication on high-value items</span>
                  </li>
                </ul>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button size="lg" className="w-full sm:w-auto">
                    Create Free Account
                  </Button>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Learn More
                  </Button>
                </div>
              </div>
              <div className="relative h-[400px] overflow-hidden rounded-xl">
                <Image
                  src="/placeholder.svg?height=800&width=600"
                  alt="Auction items collection"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted">
        <div className="container px-4 md:px-6 py-12 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Gavel className="h-6 w-6" />
                <span className="text-xl font-bold">GoonAuctions</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The premier destination for luxury auctions and rare collectibles.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon">
                  <Facebook className="h-5 w-5" />
                  <span className="sr-only">Facebook</span>
                </Button>
                <Button variant="ghost" size="icon">
                  <Twitter className="h-5 w-5" />
                  <span className="sr-only">Twitter</span>
                </Button>
                <Button variant="ghost" size="icon">
                  <Instagram className="h-5 w-5" />
                  <span className="sr-only">Instagram</span>
                </Button>
                <Button variant="ghost" size="icon">
                  <Linkedin className="h-5 w-5" />
                  <span className="sr-only">LinkedIn</span>
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Auctions
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Categories
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Support</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Shipping Information
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Returns & Refunds
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Subscribe</h3>
              <p className="text-sm text-muted-foreground">Stay updated with new auctions and exclusive offers.</p>
              <form className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Subscribe
                </Button>
              </form>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} GoonAuctions. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
