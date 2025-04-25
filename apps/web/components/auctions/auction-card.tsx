import { Button } from "../ui/button";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/card";
import Link from "next/link";

interface AuctionCardProps {
  id: string;
  image: string;
  title: string;
  description: string;
  endDate: string;
}

export default function AuctionCard({ id, image, title, description, endDate }: AuctionCardProps) {
  const formatTimeRemaining = (endDate: string) => {
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

  return (
    <Card className="h-full pt-0 flex flex-col">
      <CardHeader className="relative h-72">
        <Image src={image} alt={title} fill className="object-cover rounded-t-lg" />
      </CardHeader>
      <CardContent className="px-4 flex-grow">
        <CardTitle>{title}</CardTitle>
        <CardDescription className="line-clamp-2">{description}</CardDescription>
      </CardContent>
      <CardFooter className="px-4 flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {formatTimeRemaining(endDate)}
        </span>
        <Button variant="outline" asChild>
          <Link href={`/auctions/${id}`}>View Auction</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
