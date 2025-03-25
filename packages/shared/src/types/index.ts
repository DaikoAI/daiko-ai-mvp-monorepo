import { z } from 'zod';

// ニュース記事の型定義
export const NewsSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string().optional(),
  summary: z.string().optional(),
  url: z.string().url(),
  imageUrl: z.string().url().optional(),
  publishedAt: z.string().or(z.date()),
  source: z.string(),
  categories: z.array(z.string()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type News = z.infer<typeof NewsSchema>;

// X(Twitter)の投稿型定義
export const TweetSchema = z.object({
  id: z.string(),
  text: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  authorUsername: z.string(),
  authorProfileImageUrl: z.string().url().optional(),
  createdAt: z.string().or(z.date()),
  likeCount: z.number().optional(),
  retweetCount: z.number().optional(),
  replyCount: z.number().optional(),
  url: z.string().url().optional(),
  mediaUrls: z.array(z.string().url()).optional(),
});

export type Tweet = z.infer<typeof TweetSchema>;

// ユーザープロファイル型定義
export const UserProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email().optional(),
  displayName: z.string().optional(),
  photoURL: z.string().url().optional(),
  interests: z.array(z.string()).optional(),
  preferredCategories: z.array(z.string()).optional(),
  preferredSources: z.array(z.string()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// コレクション名の定数
export const COLLECTIONS = {
  NEWS: 'news',
  TWEETS: 'tweets',
  USER_PROFILES: 'userProfiles',
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];