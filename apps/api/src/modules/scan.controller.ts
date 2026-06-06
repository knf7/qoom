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
} from '@nestjs/common';
import { ScanService } from './scan.service';
import { CreateProjectInput, CreateScanInput } from '@qoom/types';
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
    @Body() body: CreateProjectInput
  ) {
    return this.scanService.createProject(user.id, body);
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
    @Body() body: { description?: string; title?: string }
  ) {
    return this.scanService.updateProject(user.id, projectId, body);
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
  async getPassport(@Param('id') scanId: string) {
    return this.scanService.getPassportCredentials(scanId);
  }
}
