import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_URL } from '@/config';

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export default function Contact() {
  const [loading, setLoading] = useState(true);
  const [] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pageContent, setPageContent] = useState({
    contactPageHero: {
      title: 'Get in Touch',
      subtitle: 'Have questions? We would love to hear from you.'
    },
    contactPageInfo: {
      address: '123 Brownie Street, Sweet City',
      email: 'hello@brownieshop.com',
      phone: '+1 234 567 8900',
      hours: 'Mon-Fri: 9:00 AM - 6:00 PM'
    }
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`${API_URL}/api/content/home-content`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch content');
        const data = await response.json();
        if (data) {
          setPageContent({
            contactPageHero: data.contactPageHero || pageContent.contactPageHero,
            contactPageInfo: data.contactPageInfo || pageContent.contactPageInfo
          });
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  const validateField = (name: string, value: string) => {
    try {
      contactSchema.shape[name as keyof typeof contactSchema.shape].parse(value);
      setErrors(prev => ({ ...prev, [name]: "" }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [name]: error.errors[0].message }));
      }
      return false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate all fields
    const isValid = Object.entries(formData).every(([key, value]) => 
      validateField(key, value)
    );

    if (!isValid) {
      setLoading(false);
      toast.error("Please check the form for errors");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/contact`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) throw new Error("Failed to send message");

      toast.success("Your message has been sent successfully!");

      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      toast.error("Failed to send message. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-16 bg-background">
        {/* Hero Section */}
        <section className="py-20 bg-muted">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl font-bold mb-4 text-foreground">
                {pageContent.contactPageHero.title}
              </h1>
              <p className="text-lg text-muted-foreground pt-4">
                {pageContent.contactPageHero.subtitle}
              </p>
            </div>
          </motion.div>
        </section>

        {/* Contact Section */}
        <section className="py-12 bg-background">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            <div className="grid md:grid-cols-2 gap-8">
              {/* Contact Info Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <Card className="h-[500px]">
                  <CardHeader>
                    <CardTitle className="pt-2">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="flex items-start space-x-4 pt-6">
                      <MapPin className="h-6 w-6 text-primary shrink-0" />
                      <div>
                        <h3 className="text-lg font-semibold">Visit Us</h3>
                        <p className="text-muted-foreground">{pageContent.contactPageInfo.address}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <Mail className="h-6 w-6 text-primary shrink-0" />
                      <div>
                        <h3 className="text-lg font-semibold">Email Us</h3>
                        <p className="text-muted-foreground">{pageContent.contactPageInfo.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <Phone className="h-6 w-6 text-primary shrink-0" />
                      <div>
                        <h3 className="text-lg font-semibold">Call Us</h3>
                        <p className="text-muted-foreground">{pageContent.contactPageInfo.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <Clock className="h-6 w-6 text-primary shrink-0" />
                      <div>
                        <h3 className="text-lg font-semibold">Business Hours</h3>
                        <p className="text-muted-foreground">{pageContent.contactPageInfo.hours}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Contact Form Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="h-[500px]">
                  <CardContent className="p-6 h-full flex flex-col">
                    <h3 className="text-2xl font-semibold mb-6">Send us a Message</h3>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                      <div>
                        <Input 
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Your Name" 
                          className={`text-foreground placeholder:text-muted-foreground ${
                            errors.name ? "border-red-500" : ""
                          }`}
                        />
                        {errors.name && (
                          <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                        )}
                      </div>
                      <div>
                        <Input 
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Your Email"
                          className={`text-foreground placeholder:text-muted-foreground ${
                            errors.email ? "border-red-500" : ""
                          }`}
                        />
                        {errors.email && (
                          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                        )}
                      </div>
                      <div>
                        <Input 
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          placeholder="Subject"
                          className={`text-foreground placeholder:text-muted-foreground ${
                            errors.subject ? "border-red-500" : ""
                          }`}
                        />
                        {errors.subject && (
                          <p className="text-red-500 text-sm mt-1">{errors.subject}</p>
                        )}
                      </div>
                      <div>
                        <Textarea 
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Your Message" 
                          className={`min-h-[150px] text-foreground placeholder:text-muted-foreground ${
                            errors.message ? "border-red-500" : ""
                          }`}
                        />
                        {errors.message && (
                          <p className="text-red-500 text-sm mt-1">{errors.message}</p>
                        )}
                      </div>
                      <Button className="w-full" disabled={loading}>
                        {loading ? "Sending..." : "Send Message"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Map Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="mt-8">
                <CardContent className="p-0 h-[300px]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.802548850779!2d121.04182621205684!3d14.55339237753953!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397c8f8a749d2ed%3A0x7dc20fed683b20c2!2sBurger%20King!5e0!3m2!1sen!2sph!4v1697863761057!5m2!1sen!2sph"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </section>
      </div>
    </>
  );
}
