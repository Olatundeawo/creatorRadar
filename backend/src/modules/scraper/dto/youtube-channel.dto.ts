export class YoutubeChannelDto {
  youtubeId: string;
  name: string;
  description?: string;
  subscribers: string;
  videoCount: string;
  thumbnailUrl?: string;
  channelUrl: string;
  latestUpload?: Date | null;
  email?: string;
}