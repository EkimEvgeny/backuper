import { Module } from "@nestjs/common";
import { FileManagerService } from "./services/file-manager.service";

/**
 * Модуль для работы с классами FileManager
 */
@Module({
  providers: [FileManagerService],
  exports:[FileManagerService,FileManagerModule]
})
export class FileManagerModule {}
