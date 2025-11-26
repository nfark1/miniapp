export type View = "home" | "item" | "fav" | "profile" | "admin" | "add" | "edit"| "seller_profile";

export type ListingStatus = "active" | "moderation" | "hidden";

export type Listing = {
  id: number;
  title: string;
  price: number;
  district: string;
  year?: number;
  mileage?: number;
  photos: string[];
  desc?: string;
  isTop?: boolean;
  owner?: string;               // username без @
  status?: ListingStatus;
  seller_name?: string;         // имя/фамилия продавца
  seller_photo_url?: string; 
  created_at?: string;   // дата публикации
  published_at?: string;
  badge?: "top" | "premium" | null;
};