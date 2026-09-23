import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class SearchChannelsDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsOptional()
  @IsString()
  niche?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  maxResults?: number;
}