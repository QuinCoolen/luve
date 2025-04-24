import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Select, SelectItem, SelectLabel, SelectGroup, SelectContent, SelectTrigger, SelectValue } from "../../components/ui/select";
import AuctionCard from "../../components/auctions/auction-card";

export default function Auctions() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-row justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Auctions</h1>
          <p className="text-gray-600 mb-4">
            Browse through our latest auctions and find your next favorite item.
          </p>
        </div>
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AuctionCard
          image="/images/watch.png"
          title="Vintage Patek Philippe Watch Auction"
          description="A rare vintage Patek Philippe watch up for grabs in our latest auction."
          endDate="2 days"
        />
        <AuctionCard
          image="/images/furniture.png"
          title="Vintage Furniture Auction"
          description="A collection of vintage furniture, for the perfect home."
          endDate="5 days"
        />
        <AuctionCard
          image="/images/painting.png"
          title="Vintage Painting Auction"
          description="A rare vintage painting, which is a masterpiece."
          endDate="10 days"
        />
      </div>
    </div>
  )
}
