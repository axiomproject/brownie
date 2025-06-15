import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { API_URL } from '@/config';

export default function About() {
  interface Value {
    title: string;
    description: string;
  }

  const [content, setContent] = useState({
    aboutPageHero: {
      title: 'Our Story',
      subtitle: 'From a small kitchen to your favorite brownie destination'
    },
    aboutPageStory: {
      title: 'Started in 2010',
      content: '',
      additionalContent: 'Every brownie is crafted with care...',
      image: 'https://images.unsplash.com/photo-1604761483402-1e07d167c09b?auto=format&fit=crop&w=600'
    },
    values: [
      { title: 'Quality', description: 'Only the finest ingredients' },
      { title: 'Passion', description: 'Made with love and care' },
      { title: 'Innovation', description: 'Always creating new flavors' }
    ] as Value[]
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
          setContent({
            aboutPageHero: data.aboutPageHero || content.aboutPageHero,
            aboutPageStory: data.aboutPageStory || content.aboutPageStory,
            values: data.values || content.values
          });
        }
      } catch (error) {
        console.error('Error fetching page content:', error);
      }
    };

    fetchContent();
  }, []);

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
              <h1 className="text-5xl font-bold mb-6 text-foreground">
                {content.aboutPageHero.title}
              </h1>
              <p className="text-lg text-muted-foreground">
                {content.aboutPageHero.subtitle}
              </p>
            </div>
          </motion.div>
        </section>

        {/* Story Section */}
        <section className="py-16 bg-background">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="aspect-square bg-muted rounded-lg overflow-hidden"
              >
                <img 
                  src={content.aboutPageStory.image}
                  alt="Our Story" 
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold mb-6 text-foreground">
                  {content.aboutPageStory.title}
                </h2>
                <p className="text-lg text-muted-foreground mb-4">
                  {content.aboutPageStory.content}
                </p>
                <p className="text-lg text-muted-foreground">
                  {content.aboutPageStory.additionalContent}
                </p>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Our Values</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {content.values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center p-6"
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <div className="w-8 h-8 bg-primary rounded-full"></div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
