import { Module } from '@nestjs/common';
import { FileManagerService } from './services/file-manager.service';

@Module({
  providers: [FileManagerService],
  exports: [FileManagerService]
})
export class FileManagerModule {}
