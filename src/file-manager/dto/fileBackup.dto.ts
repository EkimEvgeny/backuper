/**
 * DTO для хранения имени файла и его пути
 */
export class FileBackup{
  constructor(filename: string, pathFile: string) {
    this.pathFile = pathFile;
    this.fileName = filename;
  }

   readonly fileName: string
   readonly pathFile: string
}