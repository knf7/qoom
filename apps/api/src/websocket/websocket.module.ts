import { Module, Global } from '@nestjs/common';
import { ScanGateway } from './scan.gateway';

@Global()
@Module({
  providers: [ScanGateway],
  exports: [ScanGateway],
})
export class WebSocketModule {}
