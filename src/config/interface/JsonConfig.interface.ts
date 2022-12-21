import { StorageTypeEnum } from "../../enum/StorageType.enum";
/**
 * Сущность конфигурации приложения
 */
export interface JsonConfig {
  /**
   * Поле хранит в себе информацию о конфигурации базы данных
   */
  dumpDatabase: {
    /**
     * Поле хранит в себе информацию название базы данных
     */
    database: string,
    /**
     * Поле хранит в себе информацию о имени пользователя базы данных
     */
    username: string,
    /**
     * Поле хранит в себе информацию о пароле пользователя базы данных
     */
    password: string,
    /**
     * Поле хранит в себе информацию о URL адресе базы данных
     */
    address: string,
    /**
     * Поле хранит в себе информацию о порте базы данных
     */
    port: string,
    /**
     * Поле хранит в себе информацию о URL адресе утилиты pg_dump.exe
     */
    pathPgDump: string,
    /**
     * Поле хранит в себе информацию о URL адресе сохранения бэкапа базы данных
     */
    databaseSaveToTmp: string
  };
  /**
   * Поле хранит в себе информацию о списке файлов и папок для архивации
   */
  pathFileOrFolderForArchive: [{
    /**
     * Поле хранит в себе информацию название архива и его местоположении
     */
    backupName: string,
    /**
     * Поле хранит в себе массив путей которые нужно заархивировать
     */
    paths: string[],
  }];
  /**
   * Поле хранит в себе информацию о URL адресе последнего бэкапа
   */
  logFilePath: string;
  /**
   * Поле хранит в себе информацию о том как часто выполнять процедуру бэкапа файлов
   */
  backupFrequency: number;
  /**
   * Поле хранит в себе информацию о местоположении папки для временных файлов
   */
  tempDirectoryPath: string;
  /**
   * Список хранилищ информа
   */
  storage: [
    {
      /**
       * Любое название хранилще
       */
      name: string;
      /**
       * Тип хранилище Яндекс или Synology
       */
      type: StorageTypeEnum;
      /**
       * Приоритет чем ниже число тем выше приоритет
       */
      priority: number;
      /**
       * Поле хранит в себе информацию о токене личного кабинета ЯндексДиска
       */
      tokenYandexDisk: string;
      /**
       * Логин к хранилищу Synology
       */
      loginSynology: string;
      /**
       * Пароль к хранилищу Synology
       */
      passwordSynology: string;
      /**
       * Адрес к хранилищу Synology
       */
      domainSynology: string;
      /**
       * Порт к хранилищу Synology
       */
      portSynology: number;
    }
  ]
}
