import { Module, Global } from '@nestjs/common';
import { ScanGateway } from './scan.gateway';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';

@Global()
@Module({
  imports: [AuthModule, DatabaseModule],
  providers: [ScanGateway],
  exports: [ScanGateway],
})
export class WebSocketModule {}
