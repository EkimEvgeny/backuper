import { Module } from '@nestjs/common';
import { SynologyService } from './services/synology.service';

@Module({
  providers: [SynologyService]
})
export class SynologyModule {}
