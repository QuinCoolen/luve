import { useState } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DollarSign, Package, Search, Trophy, Eye, MessageSquare } from "lucide-react"
import { auctionService } from "@/services/api"
import { Auction } from "@/types/auction"
import { GetServerSidePropsContext } from "next"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const getStatusColor = (status: string) => {
  switch (status) {
    case "Paid":
      return "bg-green-100 text-green-800"
    case "PaymentPending":
      return "bg-yellow-100 text-yellow-800"
    case "NotFinished":
      return "bg-blue-100 text-blue-800"
    case "Unpaid":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}


export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  if (!context.req.headers.cookie) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    }
  }

  try {
    const auctions = await auctionService.getMyAuctions(context.req.headers.cookie || '');
    return {
      props: {
        auctions,
      },
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    return {
      props: {
        auctions: [],
      },
    }
  }
}

export default function Dashboard({ auctions }: { auctions:  Auction[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const router = useRouter()

  const filteredAuctions = auctions.filter((auction) => {
    const matchesSearch =
      auction.title.toLowerCase().includes(searchTerm.toLowerCase())

    if (activeTab === "all") return matchesSearch
    if (activeTab === "paymentpending") return matchesSearch && auction.status === "PaymentPending"
    if (activeTab === "paid") return matchesSearch && auction.status === "Paid"
    if (activeTab === "notfinished") return matchesSearch && auction.status === "NotFinished"
    if (activeTab === "unpaid") return matchesSearch && auction.status === "Unpaid"


    return matchesSearch
  })

  const totalWon = auctions.length
  const totalValue = auctions.reduce((sum, auction) => sum + auction.currentPrice, 0)
  const pendingPayments = auctions.filter((a) => a.status === "PaymentPending").length

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Auctions</h1>
            <p className="text-gray-600">Manage and track auction you&apos;ve bet on.</p>
          </div>

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

              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a tab" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="notfinished">Not Finished</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="paymentpending">Pending Payment</SelectItem>
                  <SelectItem value="paid">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAuctions.map((auction) => (
              <Card key={auction.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <Image
                    src={auction.imageUrl || "/placeholder.svg"}
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
                    <span className="text-lg font-bold text-green-600">${auction.currentPrice.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Date Won:</span>
                    <span className="text-sm">{new Date(auction.endDate).toUTCString()}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Seller:</span>
                    <span className="text-sm font-medium">{auction.user.username}</span>
                  </div>
                </CardContent>

                <CardFooter className="flex gap-2">
                  <Button onClick={() => router.push(`/auctions/${auction.id}`)} variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>

                  {auction.status === "Unpaid" ? (
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