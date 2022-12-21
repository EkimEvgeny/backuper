import { Module } from '@nestjs/common';
import { SynologyService } from './services/synology.service';

/**
 * Модуль для работы с классами Synology
 */
@Module({
  providers: [SynologyService]
})
export class SynologyModule {}
