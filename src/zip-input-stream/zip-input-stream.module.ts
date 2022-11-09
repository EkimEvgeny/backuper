import { Module } from "@nestjs/common";
import { ZipInputStreamService } from "./services/zip-input-stream.service";

/**
 * Модуль для работы с классами ZipInputStream
 */
@Module({
  providers: [ZipInputStreamService],
  exports: [ ZipInputStreamService],

})
export class ZipInputStreamModule {}
