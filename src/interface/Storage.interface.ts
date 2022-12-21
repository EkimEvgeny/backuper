/**
 * Интерфейс предоставляющий стандарт для сервисов работающие с хранилищами
 */
export interface StorageInterface {
  /**
   * Метод для проверки существует ли папка в хранилище
   * @param nameFolderStorage
   */
  isFolderExistStorage(nameFolderStorage:string): Promise<boolean>;
  /**
   * Метод для создания папки в хранилище
   * @param nameFolderStorage
   */
  createFolderStorage(nameFolderStorage:string);

  /**
   * Метод для загрузки файла в хранилище
   * @param pathFIle
   * @param nameFolderStorage
   */
  uploadFileToFolderStorage(pathFIle:string,nameFolderStorage:string);
}