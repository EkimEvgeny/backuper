import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "../../config/service/config.service";
import * as dayjs from "dayjs";
import * as path from "path";
// import { ChildProcess } from "child_process";
import * as child_process from "child_process";
import { ChildProcess } from "child_process";


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

  constructor(private configService:ConfigService) {}

  /**
   * Создаёт бэкап базы данных postgres
   */
  backupDataBase(nameFolderTmp:string): string{
    const dayjsNow = dayjs();

    const pathPgDump = this.configService.pathPgDump
    const username = this.configService.username
    const password = this.configService.password
    const address = this.configService.address
    const port = this.configService.port
    const database = this.configService.database
    const databaseSaveToTmp = this.configService.databaseSaveToTmp
    const nameBackupWithDate = databaseSaveToTmp.replace(".backup",`${dayjsNow.format("(HH_mm)-(DD_MM_YYYY)")}.backup`)

    const pathBackupDataBase = path.join(nameFolderTmp, path.basename(nameBackupWithDate));

    const command = `\"${pathPgDump}\" -F c -d postgres://${username}:${password}@${address}:${port}/${database} > ${pathBackupDataBase}`
    //todo

      let yourScripts = child_process.execSync(command,{timeout:10*1000})


    return pathBackupDataBase
  }
}
