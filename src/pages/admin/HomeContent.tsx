import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { API_URL } from '@/config';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Value {
  title: string;
  description: string;
  _id?: string;
}

interface HomeContentType {
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  aboutTitle: string;
  aboutContent: string;
  aboutPageHero: {
    title: string;
    subtitle: string;
  };
  aboutPageStory: {
    title: string;
    content: string;
    additionalContent: string;
    image: string;
  };
  values: Value[];
  isActive: boolean; // Add this
  updatedAt: Date; // Add this
  contactPageHero: {
    title: string;
    subtitle: string;
  };
  contactPageInfo: {
    address: string;
    email: string;
    phone: string;
    hours: string;
  };
  menuPageHero: {
    title: string;
    subtitle: string;
  };
  appSettings: {
    appName: string;
  };
}

export default function HomeContent() {
  const [content, setContent] = useState<HomeContentType>({
    heroTitle: '',
    heroSubtitle: '',
    heroImage: '',
    aboutTitle: '',
    aboutContent: '',
    aboutPageHero: {
      title: '',
      subtitle: ''
    },
    aboutPageStory: {
      title: '',
      content: '',
      additionalContent: '',
      image: ''
    },
    values: [],
    isActive: true, // Add this
    updatedAt: new Date(), // Add this
    contactPageHero: {
      title: '',
      subtitle: ''
    },
    contactPageInfo: {
      address: '',
      email: '',
      phone: '',
      hours: ''
    },
    menuPageHero: {
      title: '',
      subtitle: ''
    },
    appSettings: {
      appName: ''
    },
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentSection, setCurrentSection] = useState("app");

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/admin/home-content`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch content');
        const data = await response.json();
        console.log('Fetched admin content:', data); // Add this debug log
        setContent(data);
      } catch (error) {
        console.error('Error fetching content:', error);
        toast.error('Failed to load content');
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/home-content`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(content)
      });

      if (!response.ok) throw new Error('Failed to save content');
      toast.success('Content saved successfully');
    } catch (error) {
      toast.error('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const handleValueChange = (index: number, field: keyof Value, value: string) => {
    setContent(prev => ({
      ...prev,
      values: prev.values.map((v, i) => 
        i === index ? { ...v, [field]: value } : v
      )
    }));
  };

  const addValue = () => {
    setContent(prev => ({
      ...prev,
      values: [...prev.values, { title: '', description: '' }]
    }));
  };

  const removeValue = (index: number) => {
    setContent(prev => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }

  return (
    <div className="space-y-6 mx-auto">
      {/* Fixed position save button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          size="lg"
          className="shadow-lg"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Changes
        </Button>
      </div>

      <div className="w-full max-w-[300px] mb-6">
        <Select value={currentSection} onValueChange={setCurrentSection}>
          <SelectTrigger>
            <SelectValue placeholder="Select section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="app">App Settings</SelectItem>
            <SelectItem value="home">Home</SelectItem>
            <SelectItem value="menu">Menu</SelectItem>
            <SelectItem value="about">About</SelectItem>
            <SelectItem value="contact">Contact</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* App Settings Section */}
      {currentSection === "app" && (
        <Card>
          <CardHeader>
            <CardTitle>App Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">App Name</label>
              <Input
                value={content.appSettings?.appName}
                onChange={(e) => setContent(prev => ({
                  ...prev,
                  appSettings: { 
                    ...prev.appSettings, 
                    appName: e.target.value 
                  }
                }))}
                placeholder="Enter app name"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Home Section */}
      {currentSection === "home" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={content.heroTitle}
                  onChange={(e) => setContent({ ...content, heroTitle: e.target.value })}
                  placeholder="Enter hero title"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subtitle</label>
                <Input
                  value={content.heroSubtitle}
                  onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })}
                  placeholder="Enter hero subtitle"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Hero Image URL</label>
                <Input
                  value={content.heroImage}
                  onChange={(e) => setContent({ ...content, heroImage: e.target.value })}
                  placeholder="Enter hero image URL"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={content.aboutTitle}
                  onChange={(e) => setContent({ ...content, aboutTitle: e.target.value })}
                  placeholder="Enter about section title"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={content.aboutContent}
                  onChange={(e) => setContent({ ...content, aboutContent: e.target.value })}
                  placeholder="Enter about section content"
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Menu Section */}
      {currentSection === "menu" && (
        <Card>
          <CardHeader>
            <CardTitle>Hero Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={content.menuPageHero.title}
                onChange={(e) => setContent(prev => ({
                  ...prev,
                  menuPageHero: { ...prev.menuPageHero, title: e.target.value }
                }))}
                placeholder="Enter menu page title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subtitle</label>
              <Input
                value={content.menuPageHero.subtitle}
                onChange={(e) => setContent(prev => ({
                  ...prev,
                  menuPageHero: { ...prev.menuPageHero, subtitle: e.target.value }
                }))}
                placeholder="Enter menu page subtitle"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* About Section */}
      {currentSection === "about" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={content.aboutPageHero.title}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    aboutPageHero: { ...prev.aboutPageHero, title: e.target.value }
                  }))}
                  placeholder="Enter about page hero title"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subtitle</label>
                <Input
                  value={content.aboutPageHero.subtitle}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    aboutPageHero: { ...prev.aboutPageHero, subtitle: e.target.value }
                  }))}
                  placeholder="Enter about page hero subtitle"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Story Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={content.aboutPageStory.title}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    aboutPageStory: { ...prev.aboutPageStory, title: e.target.value }
                  }))}
                  placeholder="Enter story title"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Main Content</label>
                <Textarea
                  value={content.aboutPageStory.content}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    aboutPageStory: { ...prev.aboutPageStory, content: e.target.value }
                  }))}
                  placeholder="Enter main story content"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Additional Content</label>
                <Textarea
                  value={content.aboutPageStory.additionalContent}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    aboutPageStory: { ...prev.aboutPageStory, additionalContent: e.target.value }
                  }))}
                  placeholder="Enter additional story content"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Image URL</label>
                <Input
                  value={content.aboutPageStory.image}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    aboutPageStory: { ...prev.aboutPageStory, image: e.target.value }
                  }))}
                  placeholder="Enter story image URL"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Values Section</span>
                <Button onClick={addValue} variant="outline" size="sm">
                  Add Value
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {content.values.map((value, index) => (
                <div key={index} className="space-y-4 p-4 border rounded-lg relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 text-destructive"
                    onClick={() => removeValue(index)}
                  >
                    ✕
                  </Button>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={value.title}
                      onChange={(e) => handleValueChange(index, 'title', e.target.value)}
                      placeholder="Enter value title"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      value={value.description}
                      onChange={(e) => handleValueChange(index, 'description', e.target.value)}
                      placeholder="Enter value description"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contact Section */}
      {currentSection === "contact" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={content.contactPageHero.title}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    contactPageHero: { ...prev.contactPageHero, title: e.target.value }
                  }))}
                  placeholder="Enter contact page hero title"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subtitle</label>
                <Input
                  value={content.contactPageHero.subtitle}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    contactPageHero: { ...prev.contactPageHero, subtitle: e.target.value }
                  }))}
                  placeholder="Enter contact page hero subtitle"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <Input
                  value={content.contactPageInfo.address}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    contactPageInfo: { ...prev.contactPageInfo, address: e.target.value }
                  }))}
                  placeholder="Enter address"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={content.contactPageInfo.email}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    contactPageInfo: { ...prev.contactPageInfo, email: e.target.value }
                  }))}
                  placeholder="Enter email"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={content.contactPageInfo.phone}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    contactPageInfo: { ...prev.contactPageInfo, phone: e.target.value }
                  }))}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Business Hours</label>
                <Input
                  value={content.contactPageInfo.hours}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    contactPageInfo: { ...prev.contactPageInfo, hours: e.target.value }
                  }))}
                  placeholder="Enter business hours"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
