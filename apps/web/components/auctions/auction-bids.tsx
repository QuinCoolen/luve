import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  DollarSignIcon,
  GavelIcon,
} from "lucide-react";
import { formatTimeRemaining } from "@/lib/utils";
import { useState } from "react";
import type { Auction } from "@/types/auction";
import type { User } from "@/types/user";
import { HubConnection } from "@microsoft/signalr";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Separator } from "../ui/separator";

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
  const [agree, setAgree] = useState(false);
  const [bidAmount, setBidAmount] = useState(
    auction.currentPrice + auction.increment
  );

  const isAuctionEnded = new Date(auction.endDate) < new Date();

  const handleBidSubmit = async () => {
    if (!connection || !user) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const dateNow = new Date().toLocaleString();
      await connection.invoke(
        "PlaceBid",
        user.id,
        auction.id,
        bidAmount,
        dateNow
      );
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
              <p className="text-lg font-medium">
                {formatTimeRemaining(auction.endDate)}
              </p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">
            Started at ${auction.startingPrice} • Minimum increment: $
            {auction.increment}
          </p>
        </div>
      </CardContent>

      {user ? (
        <CardFooter className="flex flex-col items-stretch">
          {!isAuctionEnded ? (
            <AlertDialog>
              <div className="w-full">
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

                    <AlertDialogTrigger asChild>
                      <Button variant="default" disabled={isSubmitting}>
                        {isSubmitting ? "Placing Bid..." : "Place Bid"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader className="flex items-center flex-col text-center">
                        <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-8 h-8 text-amber-500" />
                        </div>
                        <AlertDialogTitle>
                          Confirm Your Bid Details
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Please confirm your bid. Bids are binding and cannot
                          be retracted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="flex flex-col mx-8 gap-4">
                        <div className="flex items-center gap-2">
                          <GavelIcon className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Item</p>
                            <p className="font-semibold text-lg">
                              {auction.title}
                            </p>
                          </div>
                        </div>
                        <Separator className="my-1" />
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2">
                            <DollarSignIcon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">
                                Current Bid
                              </p>
                              <p className="font-semibold text-lg">
                                ${auction.currentPrice}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSignIcon className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="text-muted-foreground">Your Bid</p>
                              <p className="font-semibold text-lg">
                                ${bidAmount}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Card className="bg-destructive/10 border border-destructive/20 gap-2 mt-4 mx-4">
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                            <h3 className="text-xl text-destructive">
                              Important!
                            </h3>
                          </div>
                          <h4 className="font-semibold text-destructive">
                            Please Read Carefully
                          </h4>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-destructive">
                            By bidding on an auction, you agree to complete the
                            purchase if you win. Please ensure your bid amount
                            is correct before confirming. Bids are
                            non-retractable and binding. Make sure you are
                            comfortable with your bid before confirming.
                          </p>
                        </CardContent>
                      </Card>
                      <div className="flex items-center gap-2 mx-5">
                        <Checkbox
                          id="agree"
                          onCheckedChange={() => setAgree(!agree)}
                        />
                        <Label htmlFor="agree">
                          I understand and agree that this bid is binding,
                          non-retractable, and non-appealable. I commit to
                          purchasing this item if I am the winning bidder.
                        </Label>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel asChild>
                          <Button variant="outline">Cancel</Button>
                        </AlertDialogCancel>
                        <AlertDialogAction asChild>
                          <Button
                            onClick={() => handleBidSubmit()}
                            disabled={isSubmitting || !agree}
                          >
                            {isSubmitting ? "Placing Bid..." : "Place Bid"}
                          </Button>
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </div>

                  {error && (
                    <div className="flex items-center text-red-500 text-sm">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="text-green-500 text-sm">
                      Your bid was placed successfully!
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground">
                    Enter ${auction.currentPrice + auction.increment} or more
                  </p>
                </div>
              </div>
            </AlertDialog>
          ) : (
            <div className="bg-muted p-4 rounded-md text-center">
              <p className="font-medium">This auction has ended</p>
              <p className="text-sm text-muted-foreground mt-1">
                Final price: ${auction.currentPrice}
              </p>
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
