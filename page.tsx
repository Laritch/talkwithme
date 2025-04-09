import { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Calendar,
  MessageSquare,
  Star,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'ConsultPro | Expert Consulting Services',
  description: 'Connect with top industry experts for personalized consultation and professional services',
};

// Featured experts data
const featuredExperts = [
  {
    id: 'exp-1',
    name: 'Dr. Sarah Johnson',
    role: 'Business Strategy',
    image: '/experts/sarah-johnson.jpg',
    rating: 4.9,
    reviews: 127,
  },
  {
    id: 'exp-2',
    name: 'Michael Chen',
    role: 'Technology Consultant',
    image: '/experts/michael-chen.jpg',
    rating: 4.8,
    reviews: 94,
  },
  {
    id: 'exp-3',
    name: 'Emily Rodriguez',
    role: 'Marketing Strategist',
    image: '/experts/emily-rodriguez.jpg',
    rating: 4.7,
    reviews: 86,
  },
];

// Featured services data
const featuredServices = [
  {
    id: 'business-strategy',
    title: 'Business Strategy',
    description: 'Comprehensive business planning and growth strategy consultation',
    icon: '/icons/strategy.svg',
    popular: true,
  },
  {
    id: 'digital-transformation',
    title: 'Digital Transformation',
    description: 'Guide your organization through technological evolution',
    icon: '/icons/digital.svg',
    popular: false,
  },
  {
    id: 'marketing-brand',
    title: 'Marketing & Branding',
    description: 'Build and enhance your brand presence and marketing strategy',
    icon: '/icons/marketing.svg',
    popular: true,
  },
  {
    id: 'financial-advisory',
    title: 'Financial Advisory',
    description: 'Expert financial guidance for businesses and individuals',
    icon: '/icons/finance.svg',
    popular: false,
  },
];

// Testimonial data
const testimonials = [
  {
    id: 1,
    content: "Working with ConsultPro experts transformed our business strategy. Their insights helped us increase revenue by 35% in just six months.",
    author: "Jessica Williams",
    role: "CEO, TechStart Inc",
    image: "/testimonials/jessica.jpg"
  },
  {
    id: 2,
    content: "The marketing consultation I received was exceptional. My consultant provided actionable strategies that were easy to implement with measurable results.",
    author: "Robert Chen",
    role: "Founder, GrowthBox",
    image: "/testimonials/robert.jpg"
  },
  {
    id: 3,
    content: "ConsultPro connected me with the perfect legal expert for my startup. The advice I received saved us from potential compliance issues and set us up for success.",
    author: "Maria Lopez",
    role: "COO, InnovateTech",
    image: "/testimonials/maria.jpg"
  }
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background pt-20 pb-24">
        <div className="container px-4 sm:px-6 mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Expert Consultation for Your Success
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
                Connect with verified industry experts for personalized guidance and consultation. Take your business and career to the next level.
              </p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <Link href="/experts">
                  <Button size="lg" className="gap-2">
                    Find an Expert <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/services">
                  <Button size="lg" variant="outline">
                    Browse Services
                  </Button>
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-8 justify-center lg:justify-start text-sm">
                <div className="flex items-center">
                  <CheckCircle className="text-primary mr-2 h-5 w-5" />
                  <span>Verified Experts</span>
                </div>
                <div className="flex items-center">
                  <Users className="text-primary mr-2 h-5 w-5" />
                  <span>1:1 Consultations</span>
                </div>
                <div className="flex items-center">
                  <Star className="text-primary mr-2 h-5 w-5" />
                  <span>Top-rated Professionals</span>
                </div>
              </div>
            </div>

            <div className="flex-1 relative">
              <div className="relative z-10">
                <img
                  src="/images/hero-image.jpg"
                  alt="Expert consultation"
                  className="rounded-lg shadow-xl"
                  width={600}
                  height={400}
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&h=400&fit=crop&auto=format&q=80";
                  }}
                />
              </div>
              <div className="absolute -z-10 top-6 -right-6 w-full h-full border-8 border-primary/20 rounded-lg"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4 sm:px-6 mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Verified Experts</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50k+</div>
              <div className="text-muted-foreground">Sessions Conducted</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">98%</div>
              <div className="text-muted-foreground">Client Satisfaction</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">30+</div>
              <div className="text-muted-foreground">Specializations</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="container px-4 sm:px-6 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Consulting Services</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Professional services to help you achieve your goals and overcome challenges
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredServices.map((service) => (
              <Link href={`/services#${service.id}`} key={service.id}>
                <div className="bg-card border rounded-lg p-6 h-full transition-all hover:shadow-md hover:border-primary/50 flex flex-col">
                  <div className="mb-4">
                    <div className="bg-primary/10 p-3 inline-block rounded-lg mb-4">
                      <img
                        src={service.icon}
                        alt={service.title}
                        className="w-8 h-8"
                        onError={(e) => {
                          e.currentTarget.src = "/icons/default-service.svg";
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold">{service.title}</h3>
                      {service.popular && (
                        <Badge variant="secondary" className="ml-2">Popular</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4 flex-grow">{service.description}</p>
                  <div className="flex items-center text-primary">
                    <span className="mr-2">Learn more</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/services">
              <Button size="lg" variant="outline">
                View All Services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4 sm:px-6 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Simple steps to connect with the right expert and get the guidance you need
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card border rounded-lg p-8 relative">
              <div className="absolute -top-6 left-8 bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">1</div>
              <h3 className="text-xl font-semibold mb-4 mt-4">Find Your Expert</h3>
              <p className="text-muted-foreground mb-4">
                Browse our extensive directory of verified experts and find the perfect match for your specific needs.
              </p>
              <div className="flex items-center text-primary">
                <Link href="/experts">
                  <span className="inline-flex items-center">
                    Browse Experts <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                </Link>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-8 relative">
              <div className="absolute -top-6 left-8 bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">2</div>
              <h3 className="text-xl font-semibold mb-4 mt-4">Book a Session</h3>
              <p className="text-muted-foreground mb-4">
                Schedule a consultation at a time that works for you. Choose between video, audio, or chat-based sessions.
              </p>
              <div className="flex items-center text-primary">
                <Link href="/booking">
                  <span className="inline-flex items-center">
                    See Availability <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                </Link>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-8 relative">
              <div className="absolute -top-6 left-8 bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">3</div>
              <h3 className="text-xl font-semibold mb-4 mt-4">Get Expert Guidance</h3>
              <p className="text-muted-foreground mb-4">
                Connect with your expert at the scheduled time and receive personalized advice and actionable insights.
              </p>
              <div className="flex items-center text-primary">
                <Link href="/resources">
                  <span className="inline-flex items-center">
                    Learn More <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Experts Section */}
      <section className="py-20">
        <div className="container px-4 sm:px-6 mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-4">Meet Our Featured Experts</h2>
              <p className="text-xl text-muted-foreground max-w-2xl">
                Connect with top-rated professionals in various fields
              </p>
            </div>
            <Link href="/experts" className="mt-4 md:mt-0">
              <Button variant="outline">View All Experts</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredExperts.map((expert) => (
              <Link href={`/experts/${expert.id}`} key={expert.id}>
                <Card className="h-full transition-all hover:shadow-md">
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <Avatar className="h-16 w-16 border-2 border-primary/20">
                      <AvatarImage src={expert.image} alt={expert.name} />
                      <AvatarFallback>{expert.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{expert.name}</CardTitle>
                      <CardDescription>{expert.role}</CardDescription>
                      <div className="flex items-center mt-1">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span className="ml-1 text-sm font-medium">{expert.rating}</span>
                        <span className="ml-1 text-xs text-muted-foreground">({expert.reviews} reviews)</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className="bg-primary/5">
                        <Calendar className="h-3 w-3 mr-1" /> Available
                      </Badge>
                      <Badge variant="outline" className="bg-primary/5">
                        <MessageSquare className="h-3 w-3 mr-1" /> Chat
                      </Badge>
                      <Badge variant="outline" className="bg-primary/5">
                        <Clock className="h-3 w-3 mr-1" /> 60 min
                      </Badge>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">View Profile</Button>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4 sm:px-6 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">What Our Clients Say</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Real experiences from clients who have benefited from our expert consultations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-card border rounded-lg p-8">
                <div className="mb-6">
                  <div className="flex mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-5 w-5 text-amber-500 fill-amber-500" />
                    ))}
                  </div>
                  <p className="italic mb-6">"{testimonial.content}"</p>
                </div>
                <div className="flex items-center">
                  <Avatar className="h-12 w-12 mr-4">
                    <AvatarImage src={testimonial.image} alt={testimonial.author} />
                    <AvatarFallback>{testimonial.author.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{testimonial.author}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container px-4 sm:px-6 mx-auto">
          <div className="bg-primary/10 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Take the first step toward achieving your goals with expert guidance tailored to your needs
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg">Create an Account</Button>
              </Link>
              <Link href="/experts">
                <Button size="lg" variant="outline">Browse Experts</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
