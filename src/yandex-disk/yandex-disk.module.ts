import { Module } from "@nestjs/common";
import { ConfigModule } from "../config/config.module";
import { FileManagerModule } from "../file-manager/file-manager.module";

/**
 * Модуль для работы с классами YandexDisk
 */
@Module({
  imports: [ConfigModule,FileManagerModule],
})
export class YandexDiskModule {}
