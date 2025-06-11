import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
  return new Date(date).toLocaleString('en-US', { timeZone: 'Europe/Berlin' });
};