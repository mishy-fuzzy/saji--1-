"use client"

import { AlertCircle } from "lucide-react"

interface ServiceDetailProps {
  serviceId: string
}

export function ServiceDetail({ serviceId }: ServiceDetailProps) {
  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Service Details Unavailable</h2>
        <p className="text-muted-foreground">
          Service details are loaded from the database. Please browse our available services or contact support for more information.
        </p>
      </div>
    </div>
  )
}
              </Badge>
            </div>

            {/* Provider Card */}
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary/10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">{mockServiceDetails.provider.name}</h3>
                    {mockServiceDetails.provider.verified && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        ✓ Verified
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Rating</p>
                      <p className="text-lg font-bold text-primary flex items-center gap-1">
                        <Star className="w-4 h-4 fill-secondary text-secondary" />
                        {mockServiceDetails.provider.rating}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Reviews</p>
                      <p className="text-lg font-bold text-foreground">{mockServiceDetails.provider.reviews}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Response</p>
                      <p className="text-lg font-bold text-foreground">{mockServiceDetails.provider.responseTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Jobs Done</p>
                      <p className="text-lg font-bold text-foreground">{mockServiceDetails.provider.completedJobs}</p>
                    </div>
                  </div>

                  <Button variant="outline" className="border-2 bg-transparent rounded-lg w-full sm:w-auto">
                    View Provider Profile
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="packages" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="packages">Packages</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            {/* Packages Tab */}
            <TabsContent value="packages" className="space-y-4">
              <div className="space-y-3">
                {mockServiceDetails.packages.map((pkg) => (
                  <Card
                    key={pkg.id}
                    className={`p-6 cursor-pointer transition-all border-2 ${
                      selectedPackage.id === pkg.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground mb-1">{pkg.name}</h4>
                        <p className="text-sm text-muted-foreground mb-3">{pkg.description}</p>
                        <ul className="space-y-1">
                          {pkg.scope.map((item, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary mb-2">KES {pkg.price.toLocaleString()}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6">
              <div>
                <h4 className="font-semibold text-foreground mb-3 text-lg">Service Includes</h4>
                <ul className="space-y-2">
                  {mockServiceDetails.details.serviceIncludes.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-muted-foreground">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-3 text-lg">What You Need to Prepare</h4>
                <ul className="space-y-2">
                  {mockServiceDetails.details.whatYouNeed.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-muted-foreground">
                      <AlertCircle className="w-5 h-5 text-secondary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <Card className="p-6 bg-muted/50">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Timeline
                </h4>
                <p className="text-muted-foreground">{mockServiceDetails.details.timeline}</p>
              </Card>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-4">
              {mockServiceDetails.reviews.map((review) => (
                <Card key={review.id} className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-foreground">{review.author}</p>
                      <p className="text-sm text-muted-foreground">{review.date}</p>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground">{review.text}</p>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Booking Card */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-24 space-y-6 border-2">
            {/* Price Summary */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Price for selected package</p>
              <p className="text-4xl font-bold text-primary">KES {selectedPackage.price.toLocaleString()}</p>
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm text-muted-foreground">Secure payment guaranteed</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm text-muted-foreground">Money-back guarantee</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm text-muted-foreground">Verified professional</span>
              </div>
            </div>

            {/* Booking Button */}
            <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
              <DialogTrigger asChild>
                <Button className="w-full h-12 rounded-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary text-primary-foreground font-semibold flex items-center justify-center gap-2">
                  Book Now
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Book {selectedPackage.name}</DialogTitle>
                </DialogHeader>
                <BookingModal service={mockServiceDetails} package={selectedPackage} />
              </DialogContent>
            </Dialog>

            {/* Message Button */}
            <Button variant="outline" className="w-full border-2 bg-transparent rounded-lg h-11">
              Message Provider
            </Button>

            {/* Report Button */}
            <Button
              variant="outline"
              className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 rounded-lg h-11 bg-transparent"
            >
              Report Service
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
