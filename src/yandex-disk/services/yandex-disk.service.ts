import { Injectable, Logger } from "@nestjs/common";
import { createReadStream } from "fs";
import { parse } from "url";
import * as path from "path";
import { request } from "https";
import { meta, resources, upload } from "ya-disk";
import { waitFor } from "wait-for-event";
import { EventEmitter } from "events";
import { FileManagerService } from "../../file-manager/services/file-manager.service";
import { ConfigService } from "../../config/service/config.service";
import * as AsyncLock from "async-lock";

/**
 * Класс для работы с ЯндексДиск
 */
@Injectable()
export class YandexDiskService {
  /**
   * Поле класса хранит в себе информацию об ошибках в приложении
   * @private
   */
  private readonly logger = new Logger(YandexDiskService.name);
  private doesFileUploading = false;
  private emitter = new EventEmitter();
  lock = new AsyncLock({maxPending: 1});

  constructor(private fileService: FileManagerService,
              private configService: ConfigService) {
  }

  /**
   * Метод проверяет существует ли папка с текущей датой на ЯндексДиске
   */
  async isFolderYandexDisk(nameFolderOnYandexDisk: string): Promise<boolean> {
    try {
      await meta.get(this.configService.tokenYandexDisk, nameFolderOnYandexDisk);
    } catch (error) {
      this.logger.log(`Method isFolderYandexDisk(): ${JSON.stringify(error)}. That's okay. I'll create a folder`);
      return false;
    }
    return true;
  }

  /**
   * Создать папку на ЯндексДиске
   * @private
   */
  private async createFolderYandexDisk(nameFolderOnYandexDisk: string): Promise<boolean> {
    try {
      await resources.create(this.configService.tokenYandexDisk, `disk:/${nameFolderOnYandexDisk}`);
    } catch (error) {
      this.logger.error('Method createFolderYandexDisk(): ${JSON.stringify(error)}');
    }
    return true;
  }

  /**
   * Отправка файла на Яндекс диск
   * @param nameFIle
   * @param remotePath
   * @param fileToUpload
   * @private
   */
  private async uploadFileToFolderYandexDisk(nameFIle: string,
                                             remotePath: string,
                                             fileToUpload: string) {
    if (this.doesFileUploading)
      await waitFor("done", this.emitter);

    this.doesFileUploading = true;
    this.logger.debug(`Uploading started. File = ${fileToUpload}`);
    try {
      const { href, method } = await upload.link(this.configService.tokenYandexDisk, remotePath, true);
      const fileStream = createReadStream(fileToUpload);
      const uploadStream = request({ ...parse(href), method });

      fileStream.pipe(uploadStream);
      fileStream.on("end", () => {
        uploadStream.end();
        this.emitter.emit("done");
      })
        .on("error", (err) => {
          this.logger.error(`Can't upload file to yandex.disk ${JSON.stringify(err)}`);
          this.emitter.emit("done");
        });

      await waitFor("done", this.emitter, () => {
        this.logger.debug(`Uploading ended. File =  ${fileToUpload}`);
        this.logger.debug(`Start of the deleting. File ${fileToUpload}`);
        this.fileService.deleteFile(fileToUpload);
        this.logger.debug(`End of the deleting. File ${fileToUpload}`);
        this.doesFileUploading = false;
      });
    } catch (error) {
      this.logger.error(`Method uploadToFolderYandexDisk(): ${JSON.stringify(error)}`);
      this.doesFileUploading = false;
    }
  }

  /**
   * Метод использует Множество действий (Создание папки и отправку файла на ЯндексДиск)
   */
  async uploadYandexDisk(pathFile: string, nameFolderOnYandexDisk: string) {
    const isFolder = await this.isFolderYandexDisk(nameFolderOnYandexDisk);

    if (!isFolder) {
      await this.createFolderYandexDisk(nameFolderOnYandexDisk);
    }

    const isZipFile: boolean = path.extname(pathFile) === ".zip";
    let nameFileOnYaDisk: string = "";
    if (isZipFile) {
      nameFileOnYaDisk = path.basename(pathFile).replace(path.basename(pathFile), nameFolderOnYandexDisk + "__" + path.basename(pathFile));
    } else {
      nameFileOnYaDisk = path.basename(pathFile);
    }

    const fileToUpload = pathFile;
    const remotePath = `disk:/${nameFolderOnYandexDisk}/${nameFileOnYaDisk}`;

   await this.uploadFileToFolderYandexDisk(nameFileOnYaDisk, remotePath, fileToUpload);

  }

}
