import { Injectable, Logger } from "@nestjs/common";
import * as fs from "fs";
import { parse } from "url";
import * as path from "path";
import { request } from "https";
import { meta, resources, upload } from "ya-disk";
import * as dayjs from "dayjs";
import { createReadStream } from "fs";
import { waitFor } from "wait-for-event";
import { EventEmitter } from "events";
import { FileManagerService } from "../../file-manager/services/file-manager.service";
import { FileBackup } from "../../file-manager/dto/fileBackup.dto";
import { ConfigService } from "../../config/service/config.service";

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

  constructor(private fileService: FileManagerService,
              private configService: ConfigService) {
  }

  /**
   * Название папки которая будет создана на ЯндексДиске и ей будет присвоено название "даты и времени".
   * Поумолчанию умеет значение "default".
   * @private
   */
  private folder: string = "default";

  /**
   * Метод проверяет существует ли папка с текущей датой на ЯндексДиске
   */
  async isFolderYandexDisk(): Promise<boolean> {
    try {
      await meta.get(this.configService.tokenYandexDisk, this.folder);
    } catch (error) {
      this.logger.warn("Method isFolderYandexDisk(): " + error);
      return false;
    }
    return true;
  }

  /**
   * Создать папку на ЯндексДиске
   * @private
   */
  private async createFolderYandexDisk(): Promise<boolean> {
    try {
      await resources.create(this.configService.tokenYandexDisk, `disk:/${this.folder}`);
    } catch (error) {
      this.logger.error("Method createFolderYandexDisk(): " + error);
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
  private async uploadToFolderYandexDisk(nameFIle: string,
                                         remotePath: string,
                                         fileToUpload: string) {
    const emitter = new EventEmitter();

    try {
      const { href, method } = await upload.link(this.configService.tokenYandexDisk, remotePath, true);
      const fileStream = createReadStream(fileToUpload);
      const uploadStream = request({ ...parse(href), method });

      fileStream.pipe(uploadStream);
      fileStream.on("end", () => {
        uploadStream.end();
        emitter.emit("done");
      })
        .on("error", () => {
          this.logger.error(`Can't upload file to yandex.disk`);
          emitter.emit("done");
        });

      await waitFor("done", emitter);

    } catch (error) {
      this.logger.error(`Method uploadToFolderYandexDisk(): ${error}`);
    }
  }

  /**
   * Метод использует Множество действий (Создание папки и отправку файла на ЯндексДиск)
   */
  async uploadYandexDisk() {

    this.folder = dayjs().format("HH mm-DD.MM.YYYY");

    const isFolder = await this.isFolderYandexDisk();

    if (!isFolder) {
      await this.createFolderYandexDisk();
    }

    for (const backup of await this.getAllFilesTmpDir()) {
      const timeFileBackup = dayjs().format("HH mm-DD.MM.YYYY");
      const nameFileOnYaDisk: string = backup.fileName;
      const editNameFileOnYaDisk = nameFileOnYaDisk.replace(`.`, ` ${timeFileBackup}.`);
      const fileToUpload = backup.pathFile;
      const remotePath = `disk:/${this.folder}/${editNameFileOnYaDisk}`;

      await this.uploadToFolderYandexDisk(nameFileOnYaDisk, remotePath, fileToUpload);
    }
    this.fileService.writeFileLog(this.configService.logFilePath);
  }

  /**
   * Получить все файлы из папки для временых файлов
   */
  async getAllFilesTmpDir(): Promise<FileBackup[]> {
    let result: FileBackup[] = [];

    const files = fs.readdirSync(this.configService.tempDirectoryPath);
    //listing all files using forEach
    for (const fileName of files) {
      // Do whatever you want to do with the file
      const filePath = path.join(this.configService.tempDirectoryPath, fileName);
      const fileBackup = new FileBackup(fileName, filePath);

      result.push(fileBackup);
    }

    return result;
  }
}
