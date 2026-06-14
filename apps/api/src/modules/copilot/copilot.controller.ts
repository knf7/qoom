import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { CopilotService } from './copilot.service';
import { JwtAuthGuard } from '../../security/guards/jwt.guard';
import { z } from 'zod';

const AnalyzeIdeaSchema = z.object({
  idea: z.string().min(5, 'الفكرة قصيرة جداً').max(2000, 'الفكرة طويلة جداً'),
});

const FinalizeIdeaSchema = z.object({
  rawIdea: z.string().max(3000),
  assumptions: z.array(z.string()).max(20).optional(),
  answers: z.record(z.string(), z.string()).optional(),
});

@Controller('copilot')
@UseGuards(JwtAuthGuard)
export class CopilotController {
  constructor(private readonly copilotService: CopilotService) {}

  @Post('analyze')
  async analyze(@Body() body: any) {
    try {
      const parsed = AnalyzeIdeaSchema.parse(body);
      return await this.copilotService.analyzeIdea(parsed.idea);
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new BadRequestException(err.issues[0]?.message || 'بيانات الفكرة غير صالحة');
      }
      throw new BadRequestException('فشل تحليل الفكرة');
    }
  }

  @Post('finalize')
  async finalize(@Body() body: any) {
    try {
      const parsed = FinalizeIdeaSchema.parse(body);
      return await this.copilotService.finalizeIdea(parsed);
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new BadRequestException(err.issues[0]?.message || 'بيانات الصياغة غير صالحة');
      }
      throw new BadRequestException('فشل صياغة الفكرة');
    }
  }
}
