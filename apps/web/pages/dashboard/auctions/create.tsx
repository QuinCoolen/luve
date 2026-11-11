import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useContext, useState } from "react";
import { useRouter } from "next/router";
import { AuthContext } from "@/context/auth";
import { auctionService } from "@/services/api";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { GetServerSidePropsContext } from "next";
import Link from "next/link";

const createAuctionSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title cannot be longer than 100 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description cannot be longer than 500 characters"),
  startingPrice: z
    .number({ message: "Starting price must be a number" })
    .int("Starting price must be a whole number")
    .min(1, "Starting price must be greater than 0"),
  increment: z
    .number({ message: "Increment must be a number" })
    .int("Increment must be a whole number")
    .min(1, "Increment must be greater than 0"),
  imageUrl: z
    .string()
    .min(1, "Image URL is required")
    .url("Must be a valid URL"),
  endDate: z
    .string()
    .min(1, "End date is required")
    .refine((val) => new Date(val) > new Date(), {
      message: "End date must be in the future",
    }),
});

type CreateAuctionFormData = z.infer<typeof createAuctionSchema>;

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  if (!context.req.headers.cookie) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }
  return { props: {} };
};

export default function CreateAuction() {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateAuctionFormData>({
    resolver: zodResolver(createAuctionSchema),
  });

  const onSubmit = async (data: CreateAuctionFormData) => {
    if (!user) {
      setError("You must be logged in to create an auction.");
      return;
    }

    setError(null);

    try {
      await auctionService.createAuction({
        title: data.title,
        description: data.description,
        startingPrice: data.startingPrice,
        currentPrice: data.startingPrice,
        increment: data.increment,
        status: 0,
        imageUrl: data.imageUrl,
        endDate: new Date(data.endDate).toISOString(),
        userId: String(user.id),
      });

      router.push("/dashboard/auctions");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create auction. Please try again.");
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/auctions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Auctions
          </Link>
        </Button>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Create Auction</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter auction title"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your item"
                rows={4}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startingPrice">Starting Price ($)</Label>
                <Input
                  id="startingPrice"
                  type="number"
                  placeholder="100"
                  {...register("startingPrice", { valueAsNumber: true })}
                />
                {errors.startingPrice && (
                  <p className="text-sm text-red-500">
                    {errors.startingPrice.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="increment">Bid Increment ($)</Label>
                <Input
                  id="increment"
                  type="number"
                  placeholder="10"
                  {...register("increment", { valueAsNumber: true })}
                />
                {errors.increment && (
                  <p className="text-sm text-red-500">
                    {errors.increment.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                placeholder="https://example.com/image.jpg"
                {...register("imageUrl")}
              />
              {errors.imageUrl && (
                <p className="text-sm text-red-500">
                  {errors.imageUrl.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="datetime-local"
                {...register("endDate")}
              />
              {errors.endDate && (
                <p className="text-sm text-red-500">
                  {errors.endDate.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Creating..." : "Create Auction"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
