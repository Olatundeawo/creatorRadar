export class ChannelResponseDto {
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