export interface StoreFaq {
  question: string;
  answer: string;
  linkHref?: string;
  linkLabel?: string;
}

export const STORE_FAQS: readonly StoreFaq[] = [
  {
    question: 'What products does Bricoc sell?',
    answer:
      'Bricoc currently lists golf bags, including stand and cart bags, leather golf gloves, and golf ball carriers and dispensers. The catalog shows current products and availability.',
  },
  {
    question: 'Where can I find product details and availability?',
    answer:
      'Open a product listing to review its description, images, price, and availability before ordering. Contact Bricoc if you need help with a specific listing.',
  },
  {
    question: 'How do I place an order?',
    answer:
      'Choose a product from the current catalog, review its listing details, add it to your cart, and follow the checkout steps to place your order.',
  },
  {
    question: 'Where can I find shipping destinations and delivery estimates?',
    answer:
      'The Shipping Policy explains current destinations, shipping options, processing, and estimated delivery timing. Check the policy and checkout details for your order.',
    linkHref: '/shipping-policy',
    linkLabel: 'Read our Shipping & Delivery Policy',
  },
  {
    question: 'How can I track my order?',
    answer:
      'Use the tracking information in your shipping confirmation email or visit the Track Order page. Contact support if you need help locating your order details.',
    linkHref: '/track',
    linkLabel: 'Track your order',
  },
  {
    question: 'What is your return policy?',
    answer:
      'We offer a 30-day satisfaction guarantee on all eligible Bricoc products. Full terms, return eligibility, and instructions are explained in our Return & Exchange Policy.',
    linkHref: '/return-policy',
    linkLabel: 'Read our Return & Exchange Policy',
  },
  {
    question: 'Can I return or exchange a product?',
    answer:
      'Return and exchange eligibility, timelines, and instructions are listed in the Return & Exchange Policy. Review it and contact support with questions about your order.',
    linkHref: '/return-policy',
    linkLabel: 'Read the Return & Exchange Policy',
  },
  {
    question: 'How can I contact Bricoc support?',
    answer:
      'You can use our contact form, email contact@bricoc.com, or call +1(978) 664-9000 during published support hours.',
    linkHref: '/contact',
    linkLabel: 'Contact our team',
  },
];
