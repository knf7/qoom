import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { CopilotService } from './copilot.service';
import { JwtAuthGuard } from '../../security/guards/jwt.guard';

@Controller('copilot')
@UseGuards(JwtAuthGuard)
export class CopilotController {
  constructor(private readonly copilotService: CopilotService) {}

  @Post('analyze')
  async analyze(@Body('idea') idea: string) {
    if (!idea || idea.length < 5) {
      throw new Error('الفكرة قصيرة جداً');
    }
    return await this.copilotService.analyzeIdea(idea);
  }

  @Post('finalize')
  async finalize(@Body() payload: { rawIdea: string; assumptions: any; answers: any }) {
    return await this.copilotService.finalizeIdea(payload);
  }
}
