import { Router } from 'express';
import HomeContent from '../models/HomeContent';

const router = Router();

router.get('/home-content', async (req, res) => {
  try {
    let content = await HomeContent.findOne({ isActive: true });
    
    if (!content) {
      content = await HomeContent.create({
        heroTitle: 'Heavenly Brownies',
        heroSubtitle: 'Indulge in our handcrafted, gourmet brownies',
        heroImage: '',
        aboutTitle: 'Our Story',
        aboutContent: 'Crafting perfect brownies since 2010...',
        aboutPageHero: {
          title: 'Our Story',
          subtitle: 'From a small kitchen to your favorite brownie destination'
        },
        aboutPageStory: {
          title: 'Started in 2010',
          content: 'What began as a passion project in our family kitchen has grown into a beloved destination for brownie enthusiasts. Our commitment to quality ingredients and traditional baking methods remains unchanged.',
          additionalContent: 'Every brownie is crafted with care, using time-tested recipes and the finest ingredients sourced from local suppliers whenever possible.',
          image: 'https://images.unsplash.com/photo-1604761483402-1e07d167c09b?auto=format&fit=crop&w=600'
        },
        values: [
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
        ],
        isActive: true
      });
    }

    res.json(content);
  } catch (error) {
    console.error('Error fetching public home content:', error);
    res.status(500).json({ message: 'Error fetching content' });
  }
});

export default router;
