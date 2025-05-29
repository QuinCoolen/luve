import { useState } from "react"
import Head from "next/head"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, Package, Search, Trophy, Eye, MessageSquare } from "lucide-react"

// Mock data for won auctions
const wonAuctions = [
  {
    id: 1,
    title: "Vintage Rolex Submariner",
    description: "1960s Rolex Submariner in excellent condition",
    finalBid: 15750,
    dateWon: "2024-01-15",
    status: "completed",
    image: "/images/watch.png",
    category: "Watches",
    seller: "TimepieceMaster",
    shippingStatus: "delivered",
  },
  {
    id: 2,
    title: "Original iPhone (2007) - Sealed",
    description: "First generation iPhone, factory sealed",
    finalBid: 8500,
    dateWon: "2024-01-10",
    status: "payment_pending",
    image: "/images/iphone.png",
    category: "Electronics",
    seller: "TechCollector",
    shippingStatus: "pending",
  },
  {
    id: 3,
    title: "1952 Mickey Mantle Baseball Card",
    description: "PSA Grade 8 condition",
    finalBid: 12300,
    dateWon: "2024-01-08",
    status: "completed",
    image: "/images/baseball.png",
    category: "Sports Cards",
    seller: "CardKing",
    shippingStatus: "shipped",
  },
  {
    id: 4,
    title: "Antique Persian Rug",
    description: "Hand-woven 19th century Persian rug",
    finalBid: 3200,
    dateWon: "2024-01-05",
    status: "completed",
    image: "/images/rug.png",
    category: "Antiques",
    seller: "RugMaster",
    shippingStatus: "delivered",
  },
  {
    id: 5,
    title: "Signed Beatles Vinyl Record",
    description: "Abbey Road signed by all four members",
    finalBid: 25000,
    dateWon: "2024-01-03",
    status: "completed",
    image: "/images/vinyl.png",
    category: "Music",
    seller: "VinylVault",
    shippingStatus: "delivered",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800"
    case "payment_pending":
      return "bg-yellow-100 text-yellow-800"
    case "shipping":
      return "bg-blue-100 text-blue-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getShippingStatusColor = (status: string) => {
  switch (status) {
    case "delivered":
      return "bg-green-100 text-green-800"
    case "shipped":
      return "bg-blue-100 text-blue-800"
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const filteredAuctions = wonAuctions.filter((auction) => {
    const matchesSearch =
      auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auction.category.toLowerCase().includes(searchTerm.toLowerCase())

    if (activeTab === "all") return matchesSearch
    if (activeTab === "pending") return matchesSearch && auction.status === "payment_pending"
    if (activeTab === "completed") return matchesSearch && auction.status === "completed"

    return matchesSearch
  })

  const totalWon = wonAuctions.length
  const totalValue = wonAuctions.reduce((sum, auction) => sum + auction.finalBid, 0)
  const pendingPayments = wonAuctions.filter((a) => a.status === "payment_pending").length

  return (
    <>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Auctions</h1>
            <p className="text-gray-600">Manage and track auction you've bet on.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Won</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalWon}</div>
                <p className="text-xs text-muted-foreground">Auctions won this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total winning bids</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingPayments}</div>
                <p className="text-xs text-muted-foreground">Require payment</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search auctions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending Payment</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Auctions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAuctions.map((auction) => (
              <Card key={auction.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <Image
                    src={auction.image || "/placeholder.svg"}
                    alt={auction.title}
                    width={300}
                    height={200}
                    className="w-full h-48 object-cover"
                  />
                  <Badge className={`absolute top-2 right-2 ${getStatusColor(auction.status)}`}>
                    {auction.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>

                <CardHeader>
                  <CardTitle className="text-lg line-clamp-1">{auction.title}</CardTitle>
                  <p className="text-sm text-gray-600 line-clamp-2">{auction.description}</p>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Winning Bid:</span>
                    <span className="text-lg font-bold text-green-600">${auction.finalBid.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Date Won:</span>
                    <span className="text-sm">{auction.dateWon}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Shipping:</span>
                    <Badge className={getShippingStatusColor(auction.shippingStatus)}>
                      {auction.shippingStatus.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Seller:</span>
                    <span className="text-sm font-medium">{auction.seller}</span>
                  </div>
                </CardContent>

                <CardFooter className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>

                  {auction.status === "payment_pending" ? (
                    <Button size="sm" className="flex-1">
                      Pay Now
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="flex-1">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Contact Seller
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>

          {filteredAuctions.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No auctions found</h3>
              <p className="text-gray-600">
                {searchTerm ? "Try adjusting your search terms" : "You haven't won any auctions yet"}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}