import mongoose from 'mongoose';

const homeContentSchema = new mongoose.Schema({
  heroTitle: {
    type: String,
    required: true,
    default: 'Heavenly Brownies' // Fixed typo
  },
  heroSubtitle: {
    type: String,
    required: true,
    default: 'Indulge in our handcrafted, gourmet brownies'
  },
  heroImage: {
    type: String,
    default: ''
  },
  aboutTitle: {
    type: String,
    required: true,
    default: 'Our Story' // Fixed typo
  },
  aboutContent: {
    type: String,
    required: true,
    default: 'Crafting perfect brownies since 2010...'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  aboutPageHero: {
    title: {
      type: String,
      default: 'Our Story'
    },
    subtitle: {
      type: String,
      default: 'From a small kitchen to your favorite brownie destination'
    }
  },
  aboutPageStory: {
    title: {
      type: String,
      default: 'Started in 2010'
    },
    content: {
      type: String,
      default: 'What began as a passion project in our family kitchen has grown into a beloved destination for brownie enthusiasts. Our commitment to quality ingredients and traditional baking methods remains unchanged.'
    },
    additionalContent: {
      type: String,
      default: 'Every brownie is crafted with care, using time-tested recipes and the finest ingredients sourced from local suppliers whenever possible.'
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1604761483402-1e07d167c09b?auto=format&fit=crop&w=600'
    }
  },
  contactPageHero: {
    title: {
      type: String,
      default: 'Get in Touch'
    },
    subtitle: {
      type: String,
      default: 'Have questions? We would love to hear from you.'
    }
  },
  contactPageInfo: {
    address: {
      type: String,
      default: '123 Brownie Street, Sweet City'
    },
    email: {
      type: String,
      default: 'hello@brownieshop.com'
    },
    phone: {
      type: String,
      default: '+1 234 567 8900'
    },
    hours: {
      type: String,
      default: 'Mon-Fri: 9:00 AM - 6:00 PM'
    }
  },
  menuPageHero: {
    title: {
      type: String,
      default: 'Our Menu'
    },
    subtitle: {
      type: String,
      default: 'Discover our selection of handcrafted brownies'
    }
  },
  values: [{
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    }
  }],
  appSettings: {
    appName: {
      type: String,
      default: 'Brownie'
    }
  }
});

// Add a default values middleware
homeContentSchema.pre('save', function(next) {
  if (this.isNew && !this.values.length) {
    this.values = new mongoose.Types.DocumentArray([
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
    ]);
  }
  next();
});

export default mongoose.model('HomeContent', homeContentSchema);
