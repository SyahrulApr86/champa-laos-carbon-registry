import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class GuidanceDocumentCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  // External link or a base64 data-URI (data:<mimetype>;base64,<data>).
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  documentUrl: string;
}
