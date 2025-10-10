import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Wrench, Star, Clock, Users, DollarSign, CheckCircle, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Wrench className="text-primary-foreground text-xl" />
              </div>
              <span className="text-xl font-bold text-foreground">PlumbPro</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#services" className="text-foreground hover:text-primary transition-all font-medium">Services</a>
              <a href="#how-it-works" className="text-foreground hover:text-primary transition-all font-medium">About</a>
              <a href="#contact" className="text-foreground hover:text-primary transition-all font-medium">Contact</a>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/login" className="hidden md:inline-flex text-foreground hover:text-primary transition-all font-medium">
                Sign In
              </Link>
              <Link href="/signup">
                <Button data-testid="button-get-started">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center space-x-2 bg-accent/10 text-accent px-4 py-2 rounded-full">
                <Star className="w-4 h-4" />
                <span className="text-sm font-medium">Trusted by 10,000+ customers</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Professional Plumbing Services <span className="text-primary">On Demand</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Book certified plumbers instantly. From leak repairs to complete installations, get expert help when you need it most.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <Button size="lg" className="text-lg shadow-lg hover:shadow-xl" data-testid="button-book-plumber">
                    Book a Plumber Now
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="text-lg" data-testid="button-learn-more">
                  Learn More
                </Button>
              </div>
              <div className="flex items-center space-x-8 pt-4">
                <div>
                  <div className="text-3xl font-bold text-primary">24/7</div>
                  <div className="text-sm text-muted-foreground">Emergency Service</div>
                </div>
                <div className="w-px h-12 bg-border"></div>
                <div>
                  <div className="text-3xl font-bold text-primary">500+</div>
                  <div className="text-sm text-muted-foreground">Certified Plumbers</div>
                </div>
                <div className="w-px h-12 bg-border"></div>
                <div>
                  <div className="text-3xl font-bold text-primary">98%</div>
                  <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -top-8 -left-8 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-8 -right-8 w-72 h-72 bg-accent/20 rounded-full blur-3xl"></div>
              <img 
                src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Professional plumber at work" 
                className="relative rounded-2xl shadow-2xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Our Services</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional plumbing solutions for every need, available 24/7
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "💧",
                name: "Leak Repair",
                description: "Fix dripping faucets, pipe leaks, and water damage quickly",
                color: "primary"
              },
              {
                icon: "🔧",
                name: "Installation", 
                description: "Expert installation of fixtures, pipes, and water systems",
                color: "accent"
              },
              {
                icon: "✅",
                name: "Maintenance",
                description: "Regular maintenance to prevent costly future repairs", 
                color: "success"
              },
              {
                icon: "⚠️",
                name: "Emergency",
                description: "24/7 emergency response for urgent plumbing issues",
                color: "destructive"
              }
            ].map((service, index) => (
              <div key={index} className="bg-background border border-border rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer group">
                <div className={`w-14 h-14 bg-${service.color}/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-${service.color} group-hover:scale-110 transition-all`}>
                  <span className="text-2xl">{service.icon}</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{service.name}</h3>
                <p className="text-muted-foreground text-sm">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get professional plumbing service in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-primary-foreground">1</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Book Online</h3>
              <p className="text-muted-foreground">Select your service category and describe the issue. Choose a convenient time slot.</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-accent-foreground">2</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Get Matched</h3>
              <p className="text-muted-foreground">We instantly assign a certified plumber. Receive SMS/email confirmation with details.</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-success-foreground">3</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Problem Solved</h3>
              <p className="text-muted-foreground">Plumber arrives on time, fixes the issue, and you pay securely through the platform.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Join thousands of satisfied customers who trust PlumbPro for their plumbing needs.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-lg" data-testid="button-join-now">
              Join Now <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
