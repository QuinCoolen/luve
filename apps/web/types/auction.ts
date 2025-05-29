import { User } from "./user";

export interface Auction {
  id: string;
  title: string;
  description: string;
  startingPrice: number;
  currentPrice: number;
  imageUrl: string;
  endDate: string;
  user: User;
  bids: Bid[];
}

export interface Bid {
  id: string;
  amount: number;
  bidTime: string;
  user: User;
  auction: Auction;
}
