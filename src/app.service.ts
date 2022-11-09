import { Injectable, Logger } from "@nestjs/common";
import { ZipInputStreamService } from "./zip-input-stream/services/zip-input-stream.service";
import { YandexDiskService } from "./yandex-disk/services/yandex-disk.service";
import { FileManagerService } from "./file-manager/services/file-manager.service";
import * as JSZip from "jszip";
import { DatabaseManagerService } from "./database-manager/service/database-manager.service";
import { ConfigService } from "./config/service/config.service";

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

    const allFilesTmpDir = await this.yandexService.getAllFilesTmpDir();
    for (const fileBackup of allFilesTmpDir) {
      this.fileService.deleteFile(fileBackup.pathFile);
    }

    this.fileService.createFileLog(this.configService.logFilePath);
    this.firstBackupDelay = this.fileService.lastDateBackupDifference(this.configService.logFilePath, this.getMillisecondsBetweenBackups());

    const zip = new JSZip();

    setTimeout(async () => {
      await this.createFullBackup(this.configService.pathFileOrFolderForArchive, zip);

      setInterval(async () => {
        await this.createFullBackup(this.configService.pathFileOrFolderForArchive, zip);
      }, this.getMillisecondsBetweenBackups());
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
      await this.zipService.archiveFilesAndFolders(backupData.paths, backupData.backupName, zip);
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
  getMillisecondsBetweenBackups(): number {
    let times = this.configService.backupFrequency;
    if (times < 1 || times > 24) {
      times = 1;
    }

    const getNumberOfTimesPerDay = 60 * 60 * 24 * 1000 / times;

    return Number(getNumberOfTimesPerDay.toFixed(0));
  }
}

