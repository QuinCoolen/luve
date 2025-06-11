import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, DollarSign } from "lucide-react";
import { formatTimeRemaining } from "@/lib/utils";
import { useState } from "react";
import type { Auction } from "@/types/auction";
import type { User } from "@/types/user";
import { HubConnection } from "@microsoft/signalr";

export default function AuctionBids({  
  auction,
  user,
  connection,
}: {
  auction: Auction;
  user: User | null;
  connection: HubConnection | null;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState(auction.currentPrice + auction.increment);

  const isAuctionEnded = new Date(auction.endDate) < new Date();

  const handleBidSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!connection || !user){ 
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await connection.invoke("PlaceBid", user.id, auction.id, bidAmount);
      setSuccess("Your bid was placed successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error placing bid:", err);
      setError("Failed to place bid. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Started at ${auction.startingPrice} • Minimum increment: ${auction.increment}
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
                    min={auction.currentPrice + auction.increment}
                    step={auction.increment}
                    required
                  />
                </div>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Placing Bid..." : "Place Bid"}
                </Button>
              </div>

              {error && (
                <div className="flex items-center text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {error}
                </div>
              )}

              {success && <div className="text-green-500 text-sm">Your bid was placed successfully!</div>}

              <p className="text-sm text-muted-foreground">
                Enter ${auction.currentPrice + auction.increment} or more
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
