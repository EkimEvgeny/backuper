import { Module } from '@nestjs/common';
import { DatabaseManagerService } from "./service/database-manager.service";


/**
 * Модуль для работы с классами DatabaseManager
 */
@Module({
  providers: [DatabaseManagerService],
  exports: [DatabaseManagerService]
})
export class DatabaseManagerModule {}
