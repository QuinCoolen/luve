import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import {
  formatStatus,
  formatTimeRemaining,
  formatter,
  getStatusColor,
} from "@/lib/utils";
import { auctionService } from "@/services/api";
import { Auction } from "@/types/auction";
import { Eye, Gavel, Plus } from "lucide-react";
import { GetServerSidePropsContext } from "next";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSessionUser, redirectToLogin } from "@/lib/session";

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  // Verified by identity, not just "some cookie exists".
  if (!(await getSessionUser(context))) {
    return redirectToLogin(context);
  }

  try {
    const auctions = await auctionService.getMyCreatedAuctions(
      context.req.headers.cookie || ""
    );
    return {
      props: {
        auctions,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    return {
      props: {
        auctions: [],
      },
    };
  }
};

export default function MyAuctions({ auctions }: { auctions: Auction[] }) {
  const router = useRouter();

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Auctions
          </h1>
          <p className="text-gray-600">
            Manage auctions you&apos;ve created.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/auctions/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Auction
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {auctions.map((auction) => (
          <Card
            key={auction.id}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative">
              <Image
                src={auction.imageUrl || "/placeholder.svg"}
                alt={auction.title}
                width={300}
                height={200}
                className="w-full h-48 object-cover"
              />
              <Badge
                className={`absolute top-2 right-2 ${getStatusColor(
                  auction.status
                )}`}
              >
                {formatStatus(auction.status)}
              </Badge>
            </div>

            <CardHeader>
              <CardTitle className="text-lg line-clamp-1">
                {auction.title}
              </CardTitle>
              <p className="text-sm text-gray-600 line-clamp-1">
                {auction.description}
              </p>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Current Price:</span>
                <span className="text-lg font-bold text-green-600">
                  ${formatter.format(auction.currentPrice)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Starting Price:</span>
                <span className="text-sm">
                  ${formatter.format(auction.startingPrice)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Time:</span>
                <span className="text-sm">
                  {formatTimeRemaining(auction.endDate)}
                </span>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                onClick={() => router.push(`/auctions/${auction.id}`)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {auctions.length === 0 && (
        <div className="text-center py-12">
          <Gavel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No auctions yet
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first auction to start selling.
          </p>
          <Button asChild>
            <Link href="/dashboard/auctions/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Auction
            </Link>
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
}
