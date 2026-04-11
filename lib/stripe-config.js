export const PLANS = {
  student: {
    name: 'Student',
    monthly: {
      priceId: 'price_1TL79YLKCFxaSE7TdYrpy40U',
      price: 9,
      interval: 'month',
    },
    annual: {
      priceId: 'price_1TL79xLKCFxaSE7TNalXHXjm',
      price: 69,
      interval: 'year',
    },
    features: [
      'Full 4-year course roadmap',
      'All dashboard tabs unlocked',
      'College Search tool',
      'AI Advisor chat',
      'Career Explorer',
      'Test prep & timeline',
      'Export & share',
    ],
  },
  premium: {
    name: 'Premium',
    monthly: {
      priceId: 'price_1TL7AJLKCFxaSE7TXw3pEI2R',
      price: 19,
      interval: 'month',
    },
    annual: {
      priceId: 'price_1TL7AZLKCFxaSE7TSFHzy09N',
      price: 99,
      interval: 'year',
    },
    features: [
      'Everything in Student, plus:',
      'Unlimited roadmap regenerations',
      'Multiple career comparisons',
      'Priority AI responses',
      'Interview prep tools',
      'Early access to new features',
    ],
  },
};

// Map price IDs to tier names for webhook lookups
export const PRICE_TO_TIER = {
  'price_1TL79YLKCFxaSE7TdYrpy40U': 'student',
  'price_1TL79xLKCFxaSE7TNalXHXjm': 'student',
  'price_1TL7AJLKCFxaSE7TXw3pEI2R': 'premium',
  'price_1TL7AZLKCFxaSE7TSFHzy09N': 'premium',
};
