import { Button } from "../ui/button";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/card";

interface AuctionCardProps {
  image: string;
  title: string;
  description: string;
  endDate: string;
}

export default function AuctionCard({ image, title, description, endDate }: AuctionCardProps) {
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
        <Button variant="outline">View Auction</Button>
        <span className="text-sm text-gray-500">Ends in {endDate} </span>
      </CardFooter>
    </Card>
  );
}
