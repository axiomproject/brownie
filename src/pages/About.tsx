import { Navbar } from "@/components/Navbar";

export default function About() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-16 bg-background">
        {/* Hero Section */}
        <section className="py-20 bg-muted">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl font-bold mb-6 text-foreground">Our Story</h1>
              <p className="text-lg text-muted-foreground">
                From a small kitchen to your favorite brownie destination
              </p>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1604761483402-1e07d167c09b?auto=format&fit=crop&w=600" 
                  alt="Brownies being made" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-6 text-foreground">Started in 2010</h2>
                <p className="text-lg text-muted-foreground mb-4">
                  What began as a passion project in our family kitchen has grown into a beloved
                  destination for brownie enthusiasts. Our commitment to quality ingredients and
                  traditional baking methods remains unchanged.
                </p>
                <p className="text-lg text-muted-foreground">
                  Every brownie is crafted with care, using time-tested recipes and the finest
                  ingredients sourced from local suppliers whenever possible.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Our Values</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Quality First",
                  description: "Only the finest ingredients make it into our brownies"
                },
                {
                  title: "Made with Love",
                  description: "Each brownie is crafted with attention to detail"
                },
                {
                  title: "Community Focus",
                  description: "Supporting local suppliers and our neighborhood"
                }
              ].map((value, index) => (
                <div key={index} className="text-center p-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <div className="w-8 h-8 bg-primary rounded-full"></div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
