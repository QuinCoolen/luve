import { Select, SelectItem, SelectGroup, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import AuctionCard from "@/components/auctions/auction-card";
import { useState } from "react";
import { GetServerSideProps } from "next";
import { auctionService } from "@/services/api";
import { Auction } from "@/types/auction";

interface AuctionsPageProps {
  auctions: Auction[];
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const auctions = await auctionService.getAllAuctions();
    return {
      props: {
        auctions,
      },
    };
  } catch (error) {
    console.error('Error fetching auctions:', error);
    return {
      props: {
        auctions: [],
      },
    };
  }
};

export default function AuctionsPage({ auctions }: AuctionsPageProps) {
  const [selectedCategory, setSelectedCategory] = useState("live");
  const [filteredAuctions, setFilteredAuctions] = useState(auctions);

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);

    if (selectedCategory === "live") {
      setFilteredAuctions(auctions.filter((auction) => auction.status === "NotFinished"));
    } else if (selectedCategory === "past") {
      setFilteredAuctions(auctions.filter((auction) => auction.status === "Unpaid"));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Auctions</h1>
          <p className="text-gray-600 mb-4">
            Browse through our latest auctions and find your next favorite item.
          </p>
        </div>
        <Select onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredAuctions.map((auction) => (
          <AuctionCard
            key={auction.id}
            id={auction.id}
            imageUrl={auction.imageUrl}
            title={auction.title}
            description={auction.description}
            endDate={auction.endDate}
          />
        ))}
      </div>
    </div>
  );
}
