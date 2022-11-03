import { Injectable } from "@nestjs/common";
import * as fs from "fs";

import { request } from "https";
import { parse } from "url";

import { meta, resources, upload } from "ya-disk";
import * as dayjs from "dayjs";
import { FileManagerService } from "../../file-manager/services/file-manager.service";
import * as path from "path";
import { createReadStream } from "fs";

import {EventEmitter} from 'events';
import {waitFor} from 'wait-for-event';
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
   * Метод проверяет существует ли папка на ЯндексДиске
   */
  async isFolderYandexDisk(): Promise<boolean> {
    try {
      let data = fs.readFileSync('E:/node.js/Dev/creator-backup-copies/config-application.json', 'utf8');
      const configApplication = JSON.parse(data);
      let tokenYandexDisk = configApplication['tokenYandexDisk']
      const directoryTMPPath = configApplication[`directoryTMPPath`]
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
      let data = fs.readFileSync('E:/node.js/Dev/creator-backup-copies/config-application.json', 'utf8');
      const configApplication = JSON.parse(data);
      let tokenYandexDisk = configApplication['tokenYandexDisk']
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
      let data = fs.readFileSync('E:/node.js/Dev/creator-backup-copies/config-application.json', 'utf8');
      const configApplication = JSON.parse(data);
      let tokenYandexDisk = configApplication['tokenYandexDisk']
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
    let data = fs.readFileSync('E:/node.js/Dev/creator-backup-copies/config-application.json', 'utf8');
    const configApplication = JSON.parse(data);
    const logFile = configApplication['logFile']
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
    this.fileService.writeFileLog(logFile);
  }

  /**
   * Получить все файлы из папки для временых файлов
   */
  async getAllFilesTmpDir():Promise<FileBackup[]> {
    let data = fs.readFileSync('E:/node.js/Dev/creator-backup-copies/config-application.json', 'utf8');
    const configApplication = JSON.parse(data);
    const directoryTMPPath = configApplication[`directoryTMPPath`]

    let result:FileBackup[] = [];

    const files = fs.readdirSync(directoryTMPPath);
    //listing all files using forEach
    for (const fileName of files) {
      // Do whatever you want to do with the file
      const filePath = path.join(directoryTMPPath, fileName);
      const fileBackup = new FileBackup(fileName,filePath );

      result.push(fileBackup)
    }

    return result
  }
}
