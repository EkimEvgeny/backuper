import { Module } from "@nestjs/common";
import { ZipInputStreamService } from "./services/zip-input-stream.service";
import { YandexDiskModule } from "../yandex-disk/yandex-disk.module";
import { YandexDiskService } from "../yandex-disk/services/yandex-disk.service";
import { FileManagerService } from "../file-manager/services/file-manager.service";
import { ConfigService } from "../config/service/config.service";

/**
 * Модуль для работы с классами ZipInputStream
 */
@Module({
  imports:[YandexDiskModule],
  providers: [String,ZipInputStreamService,ConfigService,YandexDiskService,FileManagerService],
  exports: [ ZipInputStreamService],

})
export class ZipInputStreamModule {}
