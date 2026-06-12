import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: any = null;

  // Define the packages
  private readonly packages: Record<string, { name: string; price: number; credits: number }> = {
    basic: { name: 'الباقة الأساسية', price: 10, credits: 5 },
    premium: { name: 'الباقة المتقدمة', price: 25, credits: 15 },
    enterprise: { name: 'الباقة الاحترافية', price: 50, credits: 50 },
  };

  constructor(private readonly prisma: PrismaService) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2022-11-15' as any,
      });
      this.logger.log('Stripe SDK initialized successfully.');
    } else {
      this.logger.warn('Stripe SECRET_KEY not found in environment. Falling back to checkout simulation.');
    }
  }

  async createCheckoutSession(userId: string, packageId: string, origin: string): Promise<{ url: string; simulated: boolean }> {
    const pkg = this.packages[packageId];
    if (!pkg) {
      throw new BadRequestException('الباقة المحددة غير صالحة.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود.');
    }

    if (this.stripe) {
      try {
        const session = await this.stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `رصيد تحليلات قوم - ${pkg.name}`,
                  description: `إضافة ${pkg.credits} عملية فحص واستخبارات للأفكار والمشاريع.`,
                },
                unit_amount: pkg.price * 100,
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&packageId=${packageId}`,
          cancel_url: `${origin}/payment/cancel`,
          metadata: {
            userId: user.id,
            credits: pkg.credits.toString(),
            packageId,
          },
        });

        return { url: session.url, simulated: false };
      } catch (err: any) {
        this.logger.error('Failed to create Stripe checkout session', err);
        // Fallback to simulation if Stripe service fails
      }
    }

    // Return simulated checkout URL
    const sessionId = `mock_session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const simulationUrl = `${origin}/checkout-simulation?session_id=${sessionId}&userId=${userId}&packageId=${packageId}&credits=${pkg.credits}&price=${pkg.price}`;
    
    return { url: simulationUrl, simulated: true };
  }

  async confirmMockPayment(userId: string, packageId: string, sessionId: string): Promise<any> {
    const pkg = this.packages[packageId];
    if (!pkg) {
      throw new BadRequestException('الباقة المحددة غير صالحة.');
    }

    // Verify session has not been credited already
    const existingLog = await this.prisma.auditLog.findFirst({
      where: {
        action: 'BILLING_PAYMENT_SUCCESS',
        details: {
          contains: sessionId,
        },
      },
    });

    if (existingLog) {
      throw new BadRequestException('تم اعتماد هذه الدفعة مسبقاً.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود.');
    }

    // Update user credits
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        scanCredits: {
          increment: pkg.credits,
        },
      },
    });

    // Log the transaction
    await this.prisma.auditLog.create({
      data: {
        action: 'BILLING_PAYMENT_SUCCESS',
        userId,
        details: JSON.stringify({
          sessionId,
          packageId,
          creditsAdded: pkg.credits,
          price: pkg.price,
          simulated: true,
        }),
      },
    });

    this.logger.log(`Mock payment successful. Added ${pkg.credits} credits to user ${userId}. New total: ${updatedUser.scanCredits}`);
    return {
      success: true,
      creditsAdded: pkg.credits,
      newCredits: updatedUser.scanCredits,
    };
  }

  async handleWebhook(signature: string, payload: Buffer): Promise<void> {
    if (!this.stripe) return;

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      this.logger.warn('Stripe WEBHOOK_SECRET not configured. Webhook processing skipped.');
      return;
    }

    let event: any;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException('Webhook signature verification failed');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const userId = session.metadata?.userId;
      const creditsStr = session.metadata?.credits;
      const packageId = session.metadata?.packageId;

      if (userId && creditsStr) {
        const credits = parseInt(creditsStr, 10);
        
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            scanCredits: {
              increment: credits,
            },
          },
        });

        await this.prisma.auditLog.create({
          data: {
            action: 'BILLING_PAYMENT_SUCCESS',
            userId,
            details: JSON.stringify({
              sessionId: session.id,
              packageId,
              creditsAdded: credits,
              price: session.amount_total ? session.amount_total / 100 : 0,
              simulated: false,
            }),
          },
        });

        this.logger.log(`Stripe payment webhook successful. Added ${credits} credits to user ${userId}`);
      }
    }
  }
}
