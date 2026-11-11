import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Gavel, UserPlus, Eye, Trophy, CreditCard, Shield } from "lucide-react";

export default function HowItWorksPage() {
  const steps = [
    {
      icon: UserPlus,
      title: "Register & Verify",
      description:
        "Create your account and complete our verification process. Join our community of collectors.",
      step: "01",
    },
    {
      icon: Eye,
      title: "Browse & Preview",
      description:
        "Explore our curated collection of exceptional items. View detailed imagery and expert appraisals.",
      step: "02",
    },
    {
      icon: Gavel,
      title: "Place Your Bids",
      description:
        "Participate in live auctions or place advance bids. Our platform ensures secure bidding experiences.",
      step: "03",
    },
    {
      icon: Trophy,
      title: "Win & Celebrate",
      description:
        "Receive instant notifications when you win. Our team handles all post-auction formalities.",
      step: "04",
    },
    {
      icon: CreditCard,
      title: "Secure Payment",
      description:
        "Complete your purchase through our encrypted payment system. Multiple payment options available.",
      step: "05",
    },
    {
      icon: Shield,
      title: "Delivery & Authentication",
      description:
        "Receive your acquisition with full authentication certificates. Worldwide insured delivery available.",
      step: "06",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance leading-tight">
            How It Works
          </h1>
          <p className="text-xl text-muted-foreground mb-12 text-pretty max-w-2xl mx-auto leading-relaxed">
            Discover how our platform makes luxury auctions accessible and
            secure for collectors worldwide.
          </p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <Card
                  key={index}
                  className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <span className="text-2xl font-bold text-muted-foreground/30">
                        {step.step}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold mb-3 text-card-foreground">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-pretty">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-balance">
            Ready to Find Your Next Treasure?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto leading-relaxed">
            Join thousands of collectors and enthusiasts. Sign up today and get
            access to exclusive auctions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="px-8 py-3 text-lg font-semibold">
              Create Free Account
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-3 text-lg font-semibold bg-transparent"
            >
              Learn More
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted-foreground">
            <div>• Free account creation</div>
            <div>• Verified sellers and secure transactions</div>
            <div>• Expert authentication on high-value items</div>
          </div>
        </div>
      </section>
    </div>
  );
}
