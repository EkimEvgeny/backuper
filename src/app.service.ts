import { Injectable, Logger } from "@nestjs/common";
import { ZipInputStreamService } from "./zip-input-stream/services/zip-input-stream.service";
import { YandexDiskService } from "./yandex-disk/services/yandex-disk.service";
import { FileManagerService } from "./file-manager/services/file-manager.service";
import { DatabaseManagerService } from "./database-manager/service/database-manager.service";
import { ConfigService } from "./config/service/config.service";
import * as dayjs from "dayjs";
import * as path from "path";
import { clearInterval } from "timers";
import * as JSZip from "jszip";
import { StorageTypeEnum } from "./enum/StorageType.enum";
import { StorageDto } from "./dto/storage.dto";


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
    this.configService.initPriority();
    let highestPriority = this.configService.firstInArrayPriority();


    const zip = new JSZip();

    setTimeout(async () => {
      setInterval(async () => {
        let isTryUpload = true;
        while (isTryUpload) {
          isTryUpload = false;
          for (const storage of this.configService.allStorage) {
            if (storage.priority === highestPriority) {
              try {
                await this.createFullBackup(this.configService.pathFileOrFolderForArchive, zip, storage);

              } catch (error) {
                const isL = this.configService.deleteFirstElementArrayPriority();
                highestPriority = this.configService.firstInArrayPriority();
                isTryUpload = true;
              }
            }
          }
        }
      }, this.getMillisecondsBetweenBackups());
      let isTryUpload = true;
      while (isTryUpload) {
        isTryUpload = false;
        for (const storage of this.configService.allStorage) {
          if (storage.priority === highestPriority) {
            try {
              await this.createFullBackup(this.configService.pathFileOrFolderForArchive, zip, storage);

            } catch (error) {
              this.configService.deleteFirstElementArrayPriority();
              highestPriority = this.configService.firstInArrayPriority();
              isTryUpload = true;
            }
          }
        }
      }
      }, this.firstBackupDelay);

  }

  /**
   * Метод для архивации,отправки на ЯндексДиск и удаления файлов.
   * @param filePathsForArchive
   * @param zip
   * @private
   */
  private async createFullBackup(filePathsForArchive, zip: JSZip, storage: StorageDto) {

    const folderTimeBackup = dayjs().format("HH-mm-DD.MM.YYYY");
    const nameFolderTimeToFolderTmp = path.join(this.configService.tempDirectoryPath, folderTimeBackup);

    if (!this.fileService.isFolderExist(folderTimeBackup, this.configService.tempDirectoryPath)) {
      this.fileService.createFolder(nameFolderTimeToFolderTmp);
    }


    this.logger.debug(`Start of the database backup process in folder ${nameFolderTimeToFolderTmp}`);
    const pathDatabaseBackup = this.databaseService.backupDataBase(path.join(this.configService.tempDirectoryPath, folderTimeBackup));
    this.logger.debug(`End of the database backup process in folder ${nameFolderTimeToFolderTmp}`);

    this.configService.queryPathFilesOnUpload.push(pathDatabaseBackup);

        switch (storage.type) {
          case StorageTypeEnum.Synology:
            break;
          case StorageTypeEnum.YandexDisk:
            await this.archiveFilesAndSaveStorageYandexDisk(nameFolderTimeToFolderTmp,
              pathDatabaseBackup,
              folderTimeBackup,
              storage,
              filePathsForArchive,
              zip);
            break;
        }





        const deleteFolderInterval = setInterval(async () => {
          if (this.fileService.isFolderExist(folderTimeBackup,this.configService.tempDirectoryPath)){
            if (!this.configService.existElementFromQueryPathFilesOnUpload(nameFolderTimeToFolderTmp)) {

              this.logger.debug(`Start the process of deleting a folder. Name folder ${nameFolderTimeToFolderTmp}`);
              this.fileService.deleteEmptyFolder(nameFolderTimeToFolderTmp);
              this.logger.debug(`End the process of deleting a folder. Name folder ${nameFolderTimeToFolderTmp}`);

              clearInterval(deleteFolderInterval);
            }
          }else {
            clearInterval(deleteFolderInterval);
          }

        }, 10 * 60 * 1000);

  }


  private async archiveFilesAndSaveStorageYandexDisk(nameFolderTimeToFolderTmp: string,
                                                     pathDatabaseBackup: string,
                                                     folderTimeBackup: string,
                                                     storage: StorageDto,
                                                     filePathsForArchive,
                                                     zip: JSZip) {


    this.logger.debug(`Start of the process of uploading database backup from folder ${nameFolderTimeToFolderTmp}`);
    const uploadedFilDBePath = await this.yandexService.uploadFileToFolderStorage(pathDatabaseBackup, folderTimeBackup, storage.tokenYandexDisk);
    this.logger.debug(`End of the process of uploading database backup`);

    this.logger.debug("Start of the process of archiving and uploading all files");
    for (const backupData of filePathsForArchive) {
      const pathTmpArchive = await this.zipService.archiveFilesAndFolders(backupData.paths, backupData.backupName, zip, folderTimeBackup);

      this.configService.addElementInArrayQueryPathFilesOnUpload(pathTmpArchive)

      const UploadedFileZipPath = await this.yandexService.uploadFileToFolderStorage(pathTmpArchive, folderTimeBackup, storage.tokenYandexDisk);

      this.configService.deleteElementFromQueryPathFilesOnUpload(UploadedFileZipPath)

      if(!(this.configService.existElementFromQueryPathFilesOnUpload(UploadedFileZipPath))){
        this.fileService.deleteFile(UploadedFileZipPath)
      }
    }
    this.logger.debug("End of the process of archiving and uploading all files");

    this.configService.deleteElementFromQueryPathFilesOnUpload(uploadedFilDBePath);


    if(!(this.configService.existElementFromQueryPathFilesOnUpload(uploadedFilDBePath))){
      this.fileService.deleteFile(uploadedFilDBePath)
    }

    this.fileService.writeFileLog(this.configService.logFilePath);
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

