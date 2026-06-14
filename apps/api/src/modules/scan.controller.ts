import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { ScanService } from './scan.service';
import { CreateProjectInput, CreateScanInput, CreateProjectSchema } from '@qoom/types';
import { z } from 'zod';
import { JwtAuthGuard } from '../security/guards/jwt.guard';
import { CurrentUser } from '../security/decorators/user.decorator';

@Controller()
export class ScanController {
  constructor(private readonly scanService: ScanService) {}

  @Post('projects')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createProject(
    @CurrentUser() user: any,
    @Body() body: any
  ) {
    try {
      const parsed = CreateProjectSchema.parse(body);
      return this.scanService.createProject(user.id, parsed);
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new BadRequestException(err.issues[0]?.message || 'بيانات غير صالحة');
      }
      throw err;
    }
  }

  @Get('projects')
  @UseGuards(JwtAuthGuard)
  async getProjects(@CurrentUser() user: any) {
    return this.scanService.getProjectsByUser(user.id);
  }

  @Patch('projects/:id')
  @UseGuards(JwtAuthGuard)
  async updateProject(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
    @Body() body: any
  ) {
    try {
      const schema = z.object({
        title: z.string().min(3).max(150).optional(),
        description: z.string().min(10).max(3000).optional()
      });
      const parsed = schema.parse(body);
      return this.scanService.updateProject(user.id, projectId, parsed);
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new BadRequestException(err.issues[0]?.message || 'بيانات غير صالحة');
      }
      throw err;
    }
  }

  @Delete('projects/:id')
  @UseGuards(JwtAuthGuard)
  async deleteProject(
    @CurrentUser() user: any,
    @Param('id') projectId: string
  ) {
    return this.scanService.deleteProject(user.id, projectId);
  }

  @Post('validate-idea')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async validateIdea(
    @CurrentUser() user: any,
    @Body() body: { description: string }
  ) {
    return this.scanService.validateIdeaWithAI(body.description);
  }

  @Post('scan')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async triggerScan(
    @CurrentUser() user: any,
    @Body() body: CreateScanInput
  ) {
    return this.scanService.triggerScan(user.id, body);
  }

  @Get('scan/:id')
  @UseGuards(JwtAuthGuard)
  async getScanDetails(
    @CurrentUser() user: any,
    @Param('id') scanId: string
  ) {
    return this.scanService.getScanDetails(user.id, scanId);
  }

  @Get('passport/:id')
  @UseGuards(JwtAuthGuard)
  async getPassport(@Param('id') scanId: string) {
    return this.scanService.getPassportCredentials(scanId);
  }

  @Post('support/request')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async submitSupportRequest(
    @CurrentUser() user: any,
    @Body() body: { email: string; message: string }
  ) {
    return this.scanService.submitSupportRequest(user.id, body.email, body.message);
  }
}
