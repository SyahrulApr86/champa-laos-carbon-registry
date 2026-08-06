import { Controller, Get, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NationalAPIService } from './national.api.service';
import { PUBLIC_FAQ_FIXTURE } from './public-content.fixture';

@ApiTags('Default')
@Controller('')
export class NationalAPIController {
  constructor(
    private readonly appService: NationalAPIService,
    private readonly logger: Logger) {}

  @Get('ping')
  @ApiOperation({ summary: 'System health check'})
  @ApiResponse({ status: 200, description: 'Environment name' })
  getHello(): string {
    this.logger.debug('Ping received debug')
    return this.appService.getHello();
  }

  @Get('faq/public')
  @ApiOperation({ summary: 'Public FAQ content contract' })
  getPublicFaq() {
    return {
      data: PUBLIC_FAQ_FIXTURE,
      meta: {
        dataset_kind: 'demo_synthetic',
        source_type: 'synthetic_demo',
        scenario: 'Champa registry demonstration',
        contentVersion: 'champa-content-demo-v1',
        localeKeys: 'homepage',
        availability: 'available',
        disclosure: 'Synthetic demonstration content, not official Lao PDR policy or contact guidance.',
      },
    };
  }
}
