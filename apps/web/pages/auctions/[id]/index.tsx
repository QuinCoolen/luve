import { GetServerSideProps } from "next";
import { auctionService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/router";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, Clock, User } from "lucide-react";
import { DollarSign } from "lucide-react";
import { formatTimeRemaining } from "@/lib/utils";
import { useState } from "react";


interface Auction {
  id: string;
  title: string;
  description: string;
  startingPrice: number;
  currentPrice: number;
  imageUrl: string;
  endDate: string;
  user: {
    id: string;
    userName: string;
    email: string;
  }
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const { id } = params as { id: string };

  const auction = await auctionService.getAuctionById(id as string);

  return { props: { auction } };
};

export default function Auction({ auction }: { auction: Auction }) {
  const router = useRouter();
  const [bidAmount, setBidAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidSuccess, setBidSuccess] = useState(false);

  const isAuctionEnded = new Date(auction.endDate) < new Date();

  const handleBidSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setBidError(null);
    setBidSuccess(false);
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Button variant="outline" onClick={() => router.back()} className="mb-4">
            &larr; Back to Auctions
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg border">
              <Image
                src={auction.imageUrl || "/placeholder.svg"}
                alt={auction.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{auction.title}</h1>

              <div className="flex items-center mt-2 space-x-4">
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground">
                    Seller: {auction.user.userName}
                  </span>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Auction Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <div>
                      <p className="text-sm font-medium">Current Bid</p>
                      <p className="text-2xl font-bold">${auction.currentPrice}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Time Left</p>
                      <p
                        className="text-lg font-medium"
                      >
                        {formatTimeRemaining(auction.endDate)}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Started at ${auction.startingPrice} • Minimum increment: $10
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col items-stretch">
                {!isAuctionEnded ? (
                  <form onSubmit={handleBidSubmit} className="w-full">
                    <div className="flex flex-col space-y-4">
                      <div className="flex space-x-2">
                        <div className="relative flex-1">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(Number(e.target.value))}
                            className="pl-9"
                            min={auction.currentPrice + 10}
                            step={1}
                            required
                          />
                        </div>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Placing Bid..." : "Place Bid"}
                        </Button>
                      </div>

                      {bidError && (
                        <div className="flex items-center text-red-500 text-sm">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {bidError}
                        </div>
                      )}

                      {bidSuccess && <div className="text-green-500 text-sm">Your bid was placed successfully!</div>}

                      <p className="text-sm text-muted-foreground">
                        Enter ${auction.currentPrice + 10} or more
                      </p>
                    </div>
                  </form>
                ) : (
                  <div className="bg-muted p-4 rounded-md text-center">
                    <p className="font-medium">This auction has ended</p>
                    <p className="text-sm text-muted-foreground mt-1">Final price: ${auction.currentPrice}</p>
                  </div>
                )}
              </CardFooter>
            </Card>

            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="bids">Bid History</TabsTrigger>
                <TabsTrigger value="seller">Seller Info</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="prose max-w-none">
                  <p>{auction.description}</p>
                </div>
              </TabsContent>

              <TabsContent value="bids">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Bid History</CardTitle>
                    <CardDescription>0 bids placed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* {auction.bids.length > 0 ? (
                        <div className="space-y-2">
                          {auction.bids.map((bid) => (
                            <div key={bid.id} className="flex justify-between items-center py-2 border-b last:border-0">
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{bid.bidderName}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="font-medium">${bid.amount}</span>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(bid.time).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : ( */}
                        <p className="text-center text-muted-foreground py-4">No bids yet. Be the first to bid!</p>
                      {/* )} */}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="seller">
                <Card>
                  <CardHeader>
                    <CardTitle>Seller Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{auction.user.userName}</p>
                        <p className="text-sm text-muted-foreground">Seller Rating: 5/5</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      Contact Seller
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  )
}