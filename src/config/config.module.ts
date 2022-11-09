import { Module } from '@nestjs/common';
import { ConfigService } from './service/config.service';

/**
 * Модуль для чтение конфигураций из файла
 */
@Module({
  providers: [{
    provide: ConfigService,
    useValue: new ConfigService(`config-application.json`),
  },
  ],
  exports: [ConfigService]
})
export class ConfigModule {}
