/**
 * DTO для хранения имени файла и его пути
 */
export class FileBackup{
  constructor(filename: string, pathFile: string) {
    this.pathFile = pathFile;
    this.fileName = filename;
  }
   /**
    Название файла вместе с расширением
    */
   readonly fileName: string

  /**
   Путь к файлу вместе с названием и расширением
   */
   readonly pathFile: string
}