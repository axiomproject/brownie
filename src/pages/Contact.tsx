import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function Contact() {
  // Example location (Manila, Philippines)
  const position: [number, number] = [14.5995, 120.9842];

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-16 bg-background">
        {/* Hero Section */}
        <section className="py-20 bg-muted">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl font-bold mb-6 text-foreground">Contact Us</h1>
              <p className="text-lg text-muted-foreground">
                We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div className="bg-card p-8 rounded-lg shadow-sm">
                <h2 className="text-2xl font-semibold text-card-foreground mb-6">Send us a Message</h2>
                <form className="space-y-4">
                  <div>
                    <Input 
                      placeholder="Your Name" 
                      className="text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <Input 
                      type="email" 
                      placeholder="Your Email"
                      className="text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <Input 
                      placeholder="Subject"
                      className="text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <Textarea 
                      placeholder="Your Message" 
                      className="min-h-[150px] text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <Button className="w-full">Send Message</Button>
                </form>
              </div>

              {/* Contact Info */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-semibold mb-6 text-foreground">Contact Information</h2>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <p className="text-foreground">123 Brownie Street, Sweet City, SC 12345</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <p className="text-foreground">(123) 456-7890</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <p className="text-foreground">hello@brownieshop.com</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <p className="text-foreground">Mon-Sat: 10:00 AM - 8:00 PM</p>
                    </div>
                  </div>
                </div>

                {/* Map */}
                <div className="aspect-video rounded-lg overflow-hidden">
                  <MapContainer 
                    center={position} 
                    zoom={15} 
                    style={{ height: '100%', width: '100%' }}
                    attributionControl={false} 
                  >
                    <TileLayer
                      attribution='© <a href="https://www.openstreetmap.org/copyright">OSM</a>' // Minimized attribution
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={position}>
                      <Popup>
                        Brownie Shop <br />
                        Visit us here!
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
