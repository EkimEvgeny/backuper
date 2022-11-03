import { Module } from "@nestjs/common";
import { AppService } from "./app.service";
import { ZipInputStreamModule } from "./zip-input-stream/zip-input-stream.module";
import { YandexDiskModule } from "./yandex-disk/yandex-disk.module";
import { YandexDiskService } from "./yandex-disk/services/yandex-disk.service";
import { FileManagerModule } from './file-manager/file-manager.module';
import { FileManagerService } from "./file-manager/services/file-manager.service";

@Module({
  imports: [ZipInputStreamModule, YandexDiskModule, FileManagerModule],
  controllers: [],
  providers: [AppService, YandexDiskService, FileManagerService],
})
export class AppModule {
    constructor(private appService: AppService) {
     appService.init().then(r =>
       console.log("Run Project")
     )
   }
}
