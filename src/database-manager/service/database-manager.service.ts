import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "../../config/service/config.service";


/**
 * Сервис для работы с базой данных
 */
@Injectable()
export class DatabaseManagerService {
  /**
   * Поле класса хранит в себе информацию об ошибках в приложении
   * @private
   */
  private readonly logger = new Logger(DatabaseManagerService.name);

  constructor(private configService:ConfigService) {
  }

  /**
   * Создаёт бэкап базы данных postgres
   */
  async backupDataBase(){
    const { exec } = require('child_process');

    const pathPgDump = this.configService.pathPgDump
    const username = this.configService.username
    const password = this.configService.password
    const address = this.configService.address
    const port = this.configService.port
    const database = this.configService.database
    const databaseSaveToTmp = this.configService.databaseSaveToTmp

    const command = `\"${pathPgDump}\" -F c -d postgres://${username}:${password}@${address}:${port}/${database} > ${databaseSaveToTmp}`
    let yourscript = exec(command,
      (error, stdout, stderr) => {
        if (error !== null) {
          this.logger.error(`Method backupDataBase(): ${error}`)
        }
      });
  }
}
