import { Injectable, Logger } from "@nestjs/common";
import { ZipInputStreamService } from "./zip-input-stream/services/zip-input-stream.service";
import { YandexDiskService } from "./yandex-disk/services/yandex-disk.service";
import { FileManagerService } from "./file-manager/services/file-manager.service";
import { DatabaseManagerService } from "./database-manager/service/database-manager.service";
import { ConfigService } from "./config/service/config.service";
import * as dayjs from "dayjs";
import * as path from "path";
import { clearInterval } from "timers";
import fetch from "node-fetch";
import * as JSZip from "jszip";



/**
 * Основной сервис для работы с другими сервисами
 */
@Injectable()
export class AppService {
  /**
   * Миллисекунды через которые запуститься первый бэкап
   * Поумолчанию стоит единица, но с помощью метода lastDateBackupDifference число инициализируется с момента последнего бекапа если условие верно
   */
  firstBackupDelay: number = 1;

  /**
   * Поле класса хранит в себе информацию об ошибках в приложении
   * @private
   */
  private readonly logger = new Logger(AppService.name);

  constructor(private zipService: ZipInputStreamService,
              private yandexService: YandexDiskService,
              private fileService: FileManagerService,
              private databaseService: DatabaseManagerService,
              private configService: ConfigService) {
  }

  /**
   * Основной метод откуда запускается приложение
   */
  async init() {

    this.fileService.createFileLog(this.configService.logFilePath);
    this.firstBackupDelay = this.fileService.lastDateBackupDifference(this.configService.logFilePath, this.getMillisecondsBetweenBackups());

    const zip = new JSZip();

    setTimeout(async () => {
      setInterval(async () => {
          await this.createFullBackup(this.configService.pathFileOrFolderForArchive, zip);
      }, this.getMillisecondsBetweenBackups());
      await this.createFullBackup(this.configService.pathFileOrFolderForArchive, zip);
    }, this.firstBackupDelay);

  }

  /**
   * Метод для архивации,отправки на ЯндексДиск и удаления файлов.
   * @param filePathsForArchive
   * @param zip
   * @private
   */
  private async createFullBackup(filePathsForArchive, zip) {

    const folderTimeBackup = dayjs().format("HH-mm-DD.MM.YYYY");
    const nameFolderTimeToFolderTmp = path.join(this.configService.tempDirectoryPath, folderTimeBackup);
    this.fileService.createFolder(nameFolderTimeToFolderTmp);

    this.logger.debug(`Start of the database backup process in folder ${nameFolderTimeToFolderTmp}`);

    const pathDatabaseBackup = this.databaseService.backupDataBase(path.join(this.configService.tempDirectoryPath, folderTimeBackup));

    this.logger.debug(`End of the database backup process in folder ${nameFolderTimeToFolderTmp}`);

    this.logger.debug(`Start of the process of uploading database backup from folder ${nameFolderTimeToFolderTmp}`);
    await this.yandexService.uploadYandexDisk(pathDatabaseBackup, folderTimeBackup);
    this.logger.debug(`End of the process of uploading database backup`);

    this.logger.debug("Start of the process of archiving and uploading all files");
    for (const backupData of filePathsForArchive) {
      await this.zipService.archiveFilesAndFolders(backupData.paths, backupData.backupName, zip, folderTimeBackup);
    }
    this.logger.debug("End of the process of archiving and uploading all files");

    this.fileService.writeFileLog(this.configService.logFilePath);

    const deleteFolderInterval = setInterval(async () => {
      if (this.fileService.isEmptyFolder(nameFolderTimeToFolderTmp)) {
        this.logger.debug(`Start the process of deleting a folder. Name folder ${nameFolderTimeToFolderTmp}`);
        this.fileService.deleteEmptyFolder(nameFolderTimeToFolderTmp);
        this.logger.debug(`End the process of deleting a folder. Name folder ${nameFolderTimeToFolderTmp}`);
        clearInterval(deleteFolderInterval);
      }
    }, 2 * 60 * 1000);
  }


  /**
   * Получить частоту создание бэкапов
   */
  private getMillisecondsBetweenBackups(): number {
    let times = this.configService.backupFrequency;
    if (times < 1 || times > 24) {
      times = 1;
    }

    const getNumberOfTimesPerDay = 60 * 60 * 24 * 1000 / times;

    return Number(getNumberOfTimesPerDay.toFixed(0));

  }
}

