import { Injectable } from "@nestjs/common";
import * as fs from "fs";
import { parse } from "url";
import * as path from "path";
import { request } from "https";
import { meta, resources, upload } from "ya-disk";
import * as dayjs from "dayjs";
import { createReadStream } from "fs";
import {waitFor} from 'wait-for-event';
import {EventEmitter} from 'events';
import { FileManagerService } from "../../file-manager/services/file-manager.service";
import { FileBackup } from "../../file-manager/dto/fileBackup.dto";


/**
 * Класс для работы с ЯндексДиск
 */
@Injectable()
export class YandexDiskService {

  constructor(private fileService: FileManagerService) {
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
      let configDataJson = fs.readFileSync('config-application.json', 'utf8');
      const configData = JSON.parse(configDataJson);
      let tokenYandexDisk = configData['tokenYandexDisk']
      await meta.get(tokenYandexDisk, this.folder);
    } catch (error) {
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
      let configDataJson = fs.readFileSync('config-application.json', 'utf8');
      const configData = JSON.parse(configDataJson);
      let tokenYandexDisk = configData['tokenYandexDisk']
      await resources.create(tokenYandexDisk, `disk:/${this.folder}`);
    } catch (error) {
      return false;
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
      let configDataJson = fs.readFileSync('config-application.json', 'utf8');
      const configData = JSON.parse(configDataJson);
      let tokenYandexDisk = configData['tokenYandexDisk']
      const { href, method } = await upload.link(tokenYandexDisk, remotePath, true);


        const fileStream = createReadStream(fileToUpload);
        const uploadStream = request({ ...parse(href), method });

        fileStream.pipe(uploadStream);
        fileStream.on("end", () => {
          uploadStream.end();
          emitter.emit('done');
        })
          .on('error', () => {
            console.log(`Can't upload file to yandex.disk`)
            emitter.emit('done');
          });

        await waitFor('done', emitter);

    } catch (error) {
      console.error("Ошибка ==== " + error);
    }
  }

  /**
   * Медор использует Множество действий (Создание папки и отправку файла)
   */
  async uploadYandexDisk() {
    let configDataJson = fs.readFileSync('config-application.json', 'utf8');
    const configData = JSON.parse(configDataJson);
    const logFilePath = configData['logFilePath']
    this.folder = dayjs().format("YYYY-MM-DD HH:mm");

    const isFolder = await this.isFolderYandexDisk();

    if (!isFolder) {
      await this.createFolderYandexDisk();
    }

    for (const backup of await this.getAllFilesTmpDir()) {
      const timeFileBackup = dayjs().format("YYYY-MM-DD HH:mm");
      const nameFileOnYaDisk: string = backup.fileName;
      const editNameFileOnYaDisk = nameFileOnYaDisk.replace(`.`,` ${timeFileBackup}.`);
      const fileToUpload = backup.pathFile;
      const remotePath = `disk:/${this.folder}/${editNameFileOnYaDisk}`;

      await this.uploadToFolderYandexDisk(nameFileOnYaDisk, remotePath, fileToUpload);
    }
    this.fileService.writeFileLog(logFilePath);
  }

  /**
   * Получить все файлы из папки для временых файлов
   */
  async getAllFilesTmpDir():Promise<FileBackup[]> {
    let configDataJson = fs.readFileSync('config-application.json', 'utf8');
    const configData = JSON.parse(configDataJson);
    const tempDirectoryPath = configData[`tempDirectoryPath`]

    let result:FileBackup[] = [];

    const files = fs.readdirSync(tempDirectoryPath);
    //listing all files using forEach
    for (const fileName of files) {
      // Do whatever you want to do with the file
      const filePath = path.join(tempDirectoryPath, fileName);
      const fileBackup = new FileBackup(fileName,filePath );

      result.push(fileBackup)
    }

    return result
  }
}
