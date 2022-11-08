import { Injectable } from "@nestjs/common";
import * as JSZip from "jszip";
import * as fs from "fs";
import * as path from "path";

/**
 * Сервис для работы архивации папок и файлов
 */
@Injectable()
export class ZipInputStreamService {

  /**
   * Записывает в zip файл
   * @param filePath
   * @param content
   */
  async writeToZip(filePath:string, content ){
    await fs.writeFile(filePath, Buffer.from(content), function (err) {
      if (err) {
        throw(err);
      } else {
        return (content);
      }
    });
  }

  /**
   * Архивировать файлы и папки внутри ПАПКИ из файла config-application
   * @param directoryPath
   * @param jsZip
   * @param currentPath
   * @private
   */
  private async archiveDirectory(directoryPath: string, jsZip: JSZip, currentPath: string){
    const files = fs.readdirSync(directoryPath);
    //listing all files using forEach
    for (const fileName of files) {
      // Do whatever you want to do with the file

      const filePath = path.join(directoryPath, fileName);

      const stats = fs.statSync( filePath)
      if(stats.isFile()){
        jsZip.file(path.join(currentPath, fileName) , await fs.readFileSync(path.join(directoryPath, fileName)));
      }
      if(stats.isDirectory()){
        await this.archiveDirectory(path.join(directoryPath, fileName), jsZip, path.join(currentPath, fileName))
      }
    };
  }

  /**
   * Архивировать файлы и папки файла config-application
   * @param directoryPaths
   * @param nameArchive
   * @param zip
   */
  async archiveFilesAndFolders(directoryPaths: string[], nameArchive: string, zip) {

    for (const pathfile of directoryPaths) {

      const isDir = fs.lstatSync(pathfile).isDirectory();

      if (isDir) {
        await this.archiveDirectory(pathfile, zip, "");
      } else {
        zip.file(path.join(pathfile), await fs.readFileSync(path.join(pathfile)));
      }

      const content = await zip.generateAsync({ type: "arraybuffer" }).then(async (content) => {
        await this.writeToZip(nameArchive, content);
      });
    }
  }

}