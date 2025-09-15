import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Diamond, BookOpen } from "lucide-react";

export default function AboutPage() {
  const coreValues = [
    {
      icon: Shield,
      title: "Trust",
      description:
        "Built on decades of integrity and transparent dealings with collectors worldwide.",
    },
    {
      icon: Diamond,
      title: "Quality",
      description:
        "Every item undergoes rigorous authentication and expert appraisal processes.",
    },
    {
      icon: BookOpen,
      title: "Expertise",
      description:
        "Our team combines deep knowledge with passion for exceptional art and collectibles.",
    },
  ];

  const teamMembers = [
    {
      name: "John Doe",
      role: "Founder & CEO",
      bio: "With over 25 years in luxury auctions, John founded GoonAuctions to democratize access to exceptional collectibles.",
      initials: "JD",
    },
    {
      name: "Jane Smith",
      role: "Chief Curator",
      bio: "Former Sotheby's specialist with expertise in contemporary art and rare manuscripts.",
      initials: "JS",
    },
    {
      name: "Mike Thompson",
      role: "Head of Authentication",
      bio: "Renowned expert in provenance research and authentication with a PhD in Art History.",
      initials: "MT",
    },
    {
      name: "James Williams",
      role: "Director of Client Relations",
      bio: "Dedicated to providing white-glove service to our distinguished collector community.",
      initials: "JW",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance leading-tight">
            About <span className="text-primary">GoonAuctions</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-3xl mx-auto leading-relaxed">
            For over two decades, we have been the trusted bridge between
            exceptional collectibles and discerning collectors, building a
            legacy of integrity, expertise, and unparalleled service.
          </p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6 text-balance">
              A Legacy of <span className="text-primary">Excellence</span>
            </h2>
          </div>
          <div className="space-y-6 text-lg leading-relaxed text-muted-foreground text-center">
            <p className="text-pretty">
              Founded in 1998 by Victoria Sterling, GoonAuctions began as a
              vision to create a more accessible and transparent luxury auction
              experience. What started as a small gallery in Manhattan has
              evolved into a globally recognized platform.
            </p>
            <p className="text-pretty">
              Our mission remains unchanged: to provide collectors with access
              to exceptional pieces while maintaining the highest standards of
              authenticity, service, and trust.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6 text-balance">
              Our <span className="text-primary">Values</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {coreValues.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <Card
                  key={index}
                  className="text-center group hover:shadow-lg transition-all duration-300 bg-card border-border/50"
                >
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                      <IconComponent className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-card-foreground">
                      {value.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-pretty">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6 text-balance">
              Meet the <span className="text-primary">Team</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member, index) => (
              <Card
                key={index}
                className="text-center group hover:shadow-lg transition-all duration-300 bg-card border-border/50"
              >
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <span className="text-primary font-bold text-lg">
                      {member.initials}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-card-foreground">
                    {member.name}
                  </h3>
                  <p className="text-primary font-medium mb-3 text-sm">
                    {member.role}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
                    {member.bio}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">25+</div>
              <div className="text-muted-foreground text-sm">
                Years of Excellence
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">$2B+</div>
              <div className="text-muted-foreground text-sm">Total Sales</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">50K+</div>
              <div className="text-muted-foreground text-sm">
                Satisfied Collectors
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">99.8%</div>
              <div className="text-muted-foreground text-sm">
                Authentication Accuracy
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-balance">
            Ready to Begin Your Collection?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto leading-relaxed">
            Join thousands of collectors who trust GoonAuctions for their most
            important acquisitions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="px-8 py-3 text-lg font-semibold">
              Start Collecting
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-3 text-lg font-semibold bg-transparent"
            >
              Contact Our Team
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
