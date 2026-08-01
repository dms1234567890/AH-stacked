import { Controller, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/public.decorator';
import { NotificationsService, WhatsAppPayload, EmailPayload } from './notifications.service';

@ApiTags('Notifications')
@Public()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('whatsapp')
  @ApiOperation({ summary: 'Send a WhatsApp notification alert' })
  async sendWhatsApp(@Body() payload: WhatsAppPayload) {
    return this.notificationsService.sendWhatsAppAlert(payload);
  }

  @Post('email')
  @ApiOperation({ summary: 'Send an email notification alert' })
  async sendEmail(@Body() payload: EmailPayload) {
    return this.notificationsService.sendEmailAlert(payload);
  }

  @Post('daily-digest')
  @ApiOperation({ summary: 'Send daily academic follow-up digest email' })
  async sendDailyDigest(
    @Query('date') date?: string,
    @Query('email') email?: string,
  ) {
    return this.notificationsService.sendDailyDigest(date, email);
  }

  @Post('test')
  @ApiOperation({ summary: 'Test notification dispatches' })
  async testNotifications() {
    const wa = await this.notificationsService.sendWhatsAppAlert({
      recipientMobile: '8253038489',
      messageText: '🚀 Prime Academic Manager System Alert: Notifications Engine Test Operational!',
    });

    const em = await this.notificationsService.sendEmailAlert({
      recipientEmail: 'academic@primeclasses.in',
      subject: 'Prime Classes System Alert Test',
      htmlBody: '<h3>System Notification Operational</h3><p>Your automated notification gateway is active.</p>',
    });

    return { success: true, whatsapp: wa, email: em };
  }
}
