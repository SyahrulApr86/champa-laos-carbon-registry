import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, IsOptional } from "class-validator";
import { AefReportTypeEnum } from "../enum/aef.report.type.enum";
import { ExportFileType } from "../enum/export.file.type.enum";

export class AefExportDto {
  @ApiProperty({ enum: AefReportTypeEnum })
  @IsNotEmpty()
  @IsEnum(AefReportTypeEnum, {
    message:
      "Invalid report type. Supported following report types:" + Object.values(AefReportTypeEnum),
  })
  reportType: AefReportTypeEnum;

  @ApiProperty({ enum: ExportFileType })
  @IsNotEmpty()
  @IsEnum(ExportFileType, {
    message: "Invalid file type. Supported following file types:" + Object.values(ExportFileType),
  })
  fileType: ExportFileType;

  @ApiPropertyOptional({ description: "Start of the report range as epoch milliseconds" })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  startTime?: number;

  @ApiPropertyOptional({ description: "End of the report range as epoch milliseconds" })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  endTime?: number;
}
