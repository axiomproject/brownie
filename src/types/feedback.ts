export interface ProductFeedbackItem {
  productId: string;
  productName: string;
  variantName: string;
  rating: number;
  comment: string;
  createdAt?: Date;
}

export interface Feedback {
  _id: string;
  orderId: string;
  productFeedback: ProductFeedbackItem[];
  createdAt: Date;
}

export interface FeedbackSubmission {
  orderId: string;
  feedback: Array<Omit<ProductFeedbackItem, 'createdAt'>>;
}

export type FeedbackRating = 1 | 2 | 3 | 4 | 5;

export interface FeedbackStats {
  averageRating: number;
  totalFeedbacks: number;
  ratingDistribution: {
    [K in FeedbackRating]: number;
  };
}
