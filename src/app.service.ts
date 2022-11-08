import { Injectable } from "@nestjs/common";
import { ZipInputStreamService } from "./zip-input-stream/services/zip-input-stream.service";
import { YandexDiskService } from "./yandex-disk/services/yandex-disk.service";
import { FileManagerService } from "./file-manager/services/file-manager.service";
import * as fs from "fs";
import * as JSZip from "jszip";
import { DatabaseManagerService } from "./database-manager/service/database-manager.service";

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
  private configData: any;

  constructor(private zipService: ZipInputStreamService,
              private yandexService: YandexDiskService,
              private fileService: FileManagerService,
              private databaseService: DatabaseManagerService) {
  }

  /**
   * Основной метод откуда запускается приложение
   */
  async init() {

    const configDataJson = fs.readFileSync("config-application.json", "utf8");
    this.configData = JSON.parse(configDataJson);

    const filePathsForArchive = this.configData["pathFileOrFolderForArchive"];
    const logFilePath = this.configData["logFilePath"];

    const allFilesTmpDir = await this.yandexService.getAllFilesTmpDir();
    for (const fileBackup of allFilesTmpDir) {
      this.fileService.deleteFile(fileBackup.pathFile);
    }

    this.fileService.createFileLog(logFilePath);
    this.firstBackupDelay = this.fileService.lastDateBackupDifference(logFilePath, this.getNumberOfTimes());

    const zip = new JSZip();

    setTimeout(async () => {
      await this.createFullBackup(filePathsForArchive, zip);

      setInterval(async () => {
        await this.createFullBackup(filePathsForArchive, zip);
      }, this.getNumberOfTimes());
    }, this.firstBackupDelay);

  }

  /**
   * Метод для архивации,отправки на ЯндексДиск и удаления файлов.
   * @param filePathsForArchive
   * @param zip
   * @private
   */
  private async createFullBackup(filePathsForArchive, zip) {
    for (const backupData of filePathsForArchive) {
      await this.zipService.archiveFilesAndFolders(backupData["paths"], backupData["backupName"], zip);
    }
    await this.databaseService.backupDataBase();
    const uploadYandexDiskPromise = await this.yandexService.uploadYandexDisk();

    const allFilesTmpDir = await this.yandexService.getAllFilesTmpDir();
    for (const fileBackup of allFilesTmpDir) {
      this.fileService.deleteFile(fileBackup.pathFile);
    }
  }

  /**
   * Получить частоту создание бэкапов
   */
  getNumberOfTimes(): number {
    let times = this.configData["backupFrequency"];
    if (times < 1 || times > 24) {
      times = 1;
    }

    const getNumberOfTimesPerDay = 60 * 60 * 24 * 1000 / times;

    return Number(getNumberOfTimesPerDay.toFixed(0));
  }
}

