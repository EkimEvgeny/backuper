import { Injectable, Logger } from "@nestjs/common";
import * as JSZip from "jszip";
import * as fs from "fs";
import * as path from "path";
import { YandexDiskService } from "../../yandex-disk/services/yandex-disk.service";
import { ConfigService } from "../../config/service/config.service";

/**
 * Сервис для работы архивации папок и файлов
 */
@Injectable()
export class ZipInputStreamService {

  constructor(private yandexDiskService: YandexDiskService,
              private configService: ConfigService) {}

  /**
   * Поле класса хранит в себе информацию об ошибках в приложении
   * @private
   */
  private readonly logger = new Logger(ZipInputStreamService.name);

  /**
   * Записывает в zip файл
   * @param filePath
   * @param content
   */
  writeToZip(filePath: string, content) {
    try {
      fs.writeFileSync(filePath, Buffer.from(content));
    } catch (error) {
      this.logger.error(`Method writeToZip(): ${JSON.stringify(error)}`);
    }
  }

  /**
   * Архивировать файлы и папки внутри ПАПКИ из файла config-application
   * @param directoryPath
   * @param jsZip
   * @param currentPath
   * @private
   */
  private async archiveDirectory(directoryPath: string, jsZip: JSZip, currentPath: string) {
    const files = fs.readdirSync(directoryPath);
    for (const fileName of files) {

      const filePath = path.join(directoryPath, fileName);

      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        jsZip.file(path.join(currentPath, fileName), await fs.readFileSync(path.join(directoryPath, fileName)));
      }
      if (stats.isDirectory()) {
        await this.archiveDirectory(path.join(directoryPath, fileName), jsZip, path.join(currentPath, fileName));
      }
    }
  }

  /**
   * Архивировать файлы и папки файла config-application
   * @param directoryPaths
   * @param nameArchive
   * @param zip
   */
  async archiveFilesAndFolders(directoryPaths: string[], nameArchive: string, zip: JSZip, nameFolderTemp: string) {
    this.logger.debug(`Start of the archiving process. Name archive ${path.basename(nameArchive)} from folder ${nameFolderTemp}`);
    const pathTmpArchive = path.join(this.configService.tempDirectoryPath,nameFolderTemp, nameArchive);

    for (const pathfile of directoryPaths) {

      const isDir = fs.lstatSync(pathfile).isDirectory();

      if (isDir) {
        await this.archiveDirectory(pathfile, zip, "");
      } else {
        zip.file(path.join(pathfile), await fs.readFileSync(path.join(pathfile)));
      }

      const content = await zip.generateAsync({ type: "arraybuffer" });
      this.writeToZip(pathTmpArchive, content);
      this.logger.debug(`End of the archiving process. Name archive ${path.basename(nameArchive)} from folder ${nameFolderTemp}`);

      await this.yandexDiskService.uploadYandexDisk(pathTmpArchive, nameFolderTemp);
    }
  }

}