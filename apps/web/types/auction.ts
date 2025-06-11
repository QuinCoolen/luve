import { User } from "./user";

export interface Auction {
  id: string;
  title: string;
  description: string;
  startingPrice: number;
  currentPrice: number;
  increment: number;
  status: string;
  imageUrl: string;
  endDate: string;
  user: User;
  bids: Bid[];
}

export interface Bid {
  id: string;
  amount: number;
  time: string;
  user: User;
  auctionId: string;
}
