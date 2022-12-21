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
import { StorageInterface } from "../../interface/Storage.interface";
/**
 * Класс для работы с ЯндексДиск
 */
@Injectable()
export class YandexDiskService implements StorageInterface {
  /**
   * Поле класса хранит в себе информацию об ошибках в приложении
   * @private
   */
  private readonly logger = new Logger(YandexDiskService.name);
  private doesFileUploading = false;
  private emitter = new EventEmitter();

  /**
   * Метод проверяет существует ли папка с текущей датой на ЯндексДиске
   */
  async isFolderExistStorage(nameFolderStorage: string, token?: string): Promise<boolean> {
    try {
      await meta.get(token, nameFolderStorage);
    } catch (error) {
      this.logger.log(`Method isFolderExistStorage(): ${JSON.stringify(error)}. That's okay. I'll create a folder`);
      return false;
    }
    return true;
  }

  /**
   * Создать папку на ЯндексДиске
   */
  async createFolderStorage(nameFolderOnYandexDisk: string, token?: string) {
    try {
      await resources.create(token, `disk:/${nameFolderOnYandexDisk}`);
    } catch (error) {
      this.logger.error("Method createFolderStorage(): ${JSON.stringify(error)}");
    }
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
                                             fileToUpload: string,
                                             token: string,
                                             noEditPathNameFile: string):Promise<string> {

    if (this.doesFileUploading)
      await waitFor("done", this.emitter);

    this.doesFileUploading = true;

    this.logger.debug(`Uploading started. File = ${fileToUpload}`);
    try {


      const { href, method } = await upload.link(token, remotePath, true);
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
        this.doesFileUploading = false;
      });
      return noEditPathNameFile

    } catch (error) {
      if (error.name === "DiskUploadTrafficLimitExceeded") {
        this.doesFileUploading = false;
        throw error;
      }
      this.doesFileUploading = false;
      this.logger.error(`Method uploadFileToFolderYandexDisk(): ${JSON.stringify(error)}`);
    }
  }

  /**
   * Метод использует Множество действий (Создание папки и отправку файла на ЯндексДиск)
   */
  async uploadFileToFolderStorage(pathFile: string,
                                  nameFolderOnYandexDisk: string,
                                  token?: string):Promise<string> {
    const isFolder = await this.isFolderExistStorage(nameFolderOnYandexDisk, token);

    if (!isFolder) {
      await this.createFolderStorage(nameFolderOnYandexDisk, token);
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

    const uploadedFilePath: string = await this.uploadFileToFolderYandexDisk(nameFileOnYaDisk, remotePath, fileToUpload, token, pathFile);
    return uploadedFilePath
  }
}

