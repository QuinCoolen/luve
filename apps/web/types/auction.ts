import { User } from "./user";

export const enum AuctionStatus {
  NotFinished = 0,
  Unpaid = 1,
  Paid = 2,
  PaymentPending = 3,
}

export interface Auction {
  id: number;
  title: string;
  description: string;
  startingPrice: number;
  currentPrice: number;
  increment: number;
  status: AuctionStatus;
  imageUrl: string;
  endDate: string;
  user: User;
  bids: Bid[];
}

export interface Bid {
  id: number;
  amount: number;
  time: string;
  user: User;
  auctionId: number;
}
