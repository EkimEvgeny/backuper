import { Injectable } from "@nestjs/common";
import { ZipInputStreamService } from "./zip-input-stream/services/zip-input-stream.service";
import { YandexDiskService } from "./yandex-disk/services/yandex-disk.service";
import { FileManagerService } from "./file-manager/services/file-manager.service";

import * as fs from "fs";
import * as path from "path";
import * as JSZip from "jszip";

/**
 * Основной сервис для работы с другими сервисами
 */
@Injectable()
export class AppService {

  differenceTIme: number = 1;
  private obj: any;


  constructor(private zipService: ZipInputStreamService,
              private yandexService: YandexDiskService,
              private fileService: FileManagerService) {
  }


  /**
   * Основной метод откуда запускается приложение
   */
  async init() {

    const data = fs.readFileSync("E:/node.js/Dev/creator-backup-copies/config-application.json", "utf8");
    this.obj = JSON.parse(data);


    const pathsFileForArchive = this.obj["pathFileOrFolderForArchive"];
    const logFile = this.obj["logFile"];


    const allFilesTmpDir = await this.yandexService.getAllFilesTmpDir();
    for (const fileBackup of allFilesTmpDir) {
      this.fileService.deleteFile(fileBackup.pathFile);
    }

    this.fileService.createFileLog(logFile);
    this.differenceTIme = this.fileService.lastDateBackupDifference(logFile, this.numberOfTimes());

    const zip = new JSZip();

    setTimeout(async () => {
      await this.fileOperations(pathsFileForArchive, zip);

      setInterval(async () => {
        await this.fileOperations(pathsFileForArchive, zip);
      }, this.numberOfTimes());
    }, 2);

  }

  /**
   * Метод для архивации,отправки на ЯндексДиск и удаления файлов.
   * Создан чтобы убрать дублирования кода
   * @param pathsFileForArchive
   * @param zip
   * @private
   */
  private async fileOperations(pathsFileForArchive, zip) {
    for (const backupData of pathsFileForArchive) {
      await this.zipService.archiveFilesAndFolders(backupData["paths"], backupData["backupName"], zip);
    }
    await this.zipService.backupDataBase();
    const uploadYandexDiskPromise = await this.yandexService.uploadYandexDisk();

    const allFilesTmpDir = await this.yandexService.getAllFilesTmpDir();
    for (const fileBackup of allFilesTmpDir) {
      this.fileService.deleteFile(fileBackup.pathFile);
    }
  }

  /**
   * Получить частоту получения бэкапов
   */
  numberOfTimes(): number {
    let times = this.obj["backup_frequency"];
    if (times < 1 || times > 24) {
      times = 1;
    }

    const number = 86400000 / this.obj["backup_frequency"];

    const s = number.toFixed(0);
    return Number(s); //число 3600000 мс в часе
  }
}

