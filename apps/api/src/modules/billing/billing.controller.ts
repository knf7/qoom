import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../../security/guards/jwt.guard';
import { CurrentUser } from '../../security/decorators/user.decorator';
import { Request } from 'express';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('create-checkout-session')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async createCheckoutSession(
    @CurrentUser() user: any,
    @Body() body: { packageId: string },
    @Headers('origin') originHeader: string
  ) {
    const origin = originHeader || 'http://localhost:5173';
    return this.billingService.createCheckoutSession(user.id, body.packageId, origin);
  }

  @Post('confirm-mock-payment')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async confirmMockPayment(
    @CurrentUser() user: any,
    @Body() body: { packageId: string; sessionId: string }
  ) {
    if (!body.packageId || !body.sessionId) {
      throw new BadRequestException('معلومات الدفعة غير مكتملة.');
    }
    return this.billingService.confirmMockPayment(user.id, body.packageId, body.sessionId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string
  ) {
    if (!signature) {
      throw new BadRequestException('Stripe signature missing');
    }
    // Stripe webhooks require raw body
    const rawBody = (req as any).rawBody || req.body;
    await this.billingService.handleWebhook(signature, rawBody);
    return { received: true };
  }
}
