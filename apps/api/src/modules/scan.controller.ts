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
import { CreateProjectInput, CreateScanInput, CreateProjectSchema, CreateScanSchema } from '@qoom/types';
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
    @Body() body: any
  ) {
    const schema = z.object({ description: z.string().min(10).max(2000) });
    try {
      const parsed = schema.parse(body);
      return this.scanService.validateIdeaWithAI(parsed.description);
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new BadRequestException(err.issues[0]?.message || 'بيانات غير صالحة');
      }
      throw err;
    }
  }

  @Post('scan')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async triggerScan(
    @CurrentUser() user: any,
    @Body() body: any
  ) {
    try {
      const parsed = CreateScanSchema.parse(body);
      return this.scanService.triggerScan(user.id, parsed);
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new BadRequestException(err.issues[0]?.message || 'بيانات غير صالحة');
      }
      throw err;
    }
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
  async getPassport(@Param('id') scanId: string) {
    return this.scanService.getPassportCredentials(scanId);
  }

  @Patch('scan/:id/problem-inference')
  @UseGuards(JwtAuthGuard)
  async confirmProblemInference(
    @CurrentUser() user: any,
    @Param('id') scanId: string
  ) {
    return this.scanService.confirmProblemInference(user.id, scanId);
  }

  @Post('support/request')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async submitSupportRequest(
    @CurrentUser() user: any,
    @Body() body: any
  ) {
    const schema = z.object({
      email: z.string().email().max(255),
      message: z.string().min(10).max(2000)
    });
    try {
      const parsed = schema.parse(body);
      return this.scanService.submitSupportRequest(user.id, parsed.email, parsed.message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new BadRequestException(err.issues[0]?.message || 'بيانات غير صالحة');
      }
      throw err;
    }
  }
}
