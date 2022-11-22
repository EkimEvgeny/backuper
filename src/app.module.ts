import { Module } from "@nestjs/common";
import { AppService } from "./app.service";
import { ZipInputStreamModule } from "./zip-input-stream/zip-input-stream.module";
import { YandexDiskModule } from "./yandex-disk/yandex-disk.module";
import { YandexDiskService } from "./yandex-disk/services/yandex-disk.service";
import { FileManagerModule } from './file-manager/file-manager.module';
import { FileManagerService } from "./file-manager/services/file-manager.service";
import { DatabaseManagerModule } from './database-manager/database-manager.module';
import { DatabaseManagerService } from "./database-manager/service/database-manager.service";
import { ConfigModule } from './config/config.module';
import { SynologyModule } from './synology/synology.module';


/**
 * Основной модуль для работы совсеми классами
 */
@Module({
  imports: [ZipInputStreamModule, YandexDiskModule, FileManagerModule, DatabaseManagerModule, ConfigModule, SynologyModule],
  providers: [AppService, YandexDiskService, FileManagerService,DatabaseManagerService],
})
export class AppModule {
    constructor(private appService: AppService) {
     appService.init().then(r =>
       console.log("Run Project")
     )
   }
}
