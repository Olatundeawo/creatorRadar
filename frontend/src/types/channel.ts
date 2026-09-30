export interface Channel {
  id: string;
  youtubeId: string;
  name: string;
  description: string | null;
  subscribers: string;
  videoCount: string;
  email: string | null;
  latestUpload: Date | null;
  thumbnailUrl: string | null;
  channelUrl: string;
  scrapedAt: Date;
  updatedAt: Date;
}

export interface SearchResponse {
  success: boolean;
  message: string;
  data: Channel[];
  timestamp: string;
}

export interface GetChannelsResponse {
  success: boolean;
  message: string;
  data: Channel[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  timestamp: string;
}

export interface CountResponse {
  success: boolean;
  total: number;
  timestamp: string;
}