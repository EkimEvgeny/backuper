import { Module } from "@nestjs/common";
import { DatabaseManagerService } from "./service/database-manager.service";
import { ConfigModule } from "../config/config.module";


/**
 * Модуль для работы с классами DatabaseManager
 */
@Module({
  providers: [DatabaseManagerService],
  exports: [DatabaseManagerService],
  imports: [ConfigModule]
})
export class DatabaseManagerModule {}
