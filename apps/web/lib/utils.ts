import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AuctionStatus } from "../types/auction";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatTimeRemaining = (endDate: string) => {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) {
    return "Auction ended";
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `Ends in ${days} days`;
  } else if (hours > 0) {
    return `Ends in ${hours} hours and ${minutes} minutes`;
  } else {
    return `Ends in ${minutes} minutes`;
  }
};

export const formatBidTime = (date: string) => {
  return new Date(date).toLocaleString();
};

export const formatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0 });

export const getStatusColor = (status: AuctionStatus) => {
  switch (status) {
    case AuctionStatus.NotFinished:
      return "bg-blue-100 text-blue-800";
    case AuctionStatus.Unpaid:
      return "bg-red-100 text-red-800";
    case AuctionStatus.Paid:
      return "bg-yellow-100 text-yellow-800";
    case AuctionStatus.PaymentPending:
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const formatStatus = (status: AuctionStatus) => {
  switch (status) {
    case AuctionStatus.NotFinished:
      return "NotFinished";
    case AuctionStatus.Unpaid:
      return "Unpaid";
    case AuctionStatus.Paid:
      return "Paid";
    case AuctionStatus.PaymentPending:
      return "PaymentPending";
    default:
      return "Unknown";
  }
};