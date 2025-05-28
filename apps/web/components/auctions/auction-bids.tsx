import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, DollarSign } from "lucide-react";
import { formatTimeRemaining } from "@/lib/utils";
import { useState } from "react";
import { Auction } from "../../types/auction";

export default function AuctionBids({  
  auction,
  user,
  isAuctionEnded,
  handleBidSubmit,
  bidAmount,
  setBidAmount,
  bidError,
  bidSuccess
}: {
  auction: Auction;
  user: any;
  isAuctionEnded: boolean;
  handleBidSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  bidAmount: number;
  setBidAmount: (value: number) => void;
  bidError: string | null;
  bidSuccess: boolean;
}) {
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Card>
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
      
      {user ? (
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
      ) : (
        <CardFooter className="flex flex-col items-stretch">
          <p className="text-center text-muted-foreground py-4">
            Please login to place a bid
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
