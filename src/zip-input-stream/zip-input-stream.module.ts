import { Module } from '@nestjs/common';
import { ZipInputStreamService } from './services/zip-input-stream.service';


@Module({
  providers: [ZipInputStreamService],
  exports: [ ZipInputStreamService]
})
export class ZipInputStreamModule {}
