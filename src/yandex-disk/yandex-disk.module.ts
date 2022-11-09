import { Module } from "@nestjs/common";
import { ConfigModule } from "../config/config.module";

/**
 * Модуль для работы с классами YandexDisk
 */
@Module({
  imports: [ConfigModule]
})
export class YandexDiskModule {}
