import { Injectable, Logger, Scope } from "@nestjs/common";
import * as fs from "fs";
import * as Joi from "joi";
import { JsonConfig } from "../interface/JsonConfig.interface";
import { StorageTypeEnum } from "../../enum/StorageType.enum";


/**
 * Сервис для создания и чтения сущности конфигураций
 */
@Injectable({scope: Scope.DEFAULT})
export class ConfigService {

  /**
   * Поле класса хранит в себе информацию о конфигурации приложения из файла конфигурации
   * @private
   */
  private readonly jsonConfig: JsonConfig;
  private _queryPathFilesOnUpload: string[] = [];
  private priorityArray = new Set;
  /**
   * Поле класса хранит в себе информацию об ошибках в приложении
   * @private
   */
  private readonly logger = new Logger(ConfigService.name);

  constructor(filePath: string) {
    let file: string | undefined;
    try {
      file = fs.readFileSync(filePath, "utf8");
    } catch (error) {
      file = fs.readFileSync("config-application.json", "utf8");
    }

    const config = JSON.parse(file);
    this.jsonConfig = this.validateInput(config);
  }

  /**
   * Метод для инициализации сущности конфигурации
   * @param jsonConfig
   * @private
   */
  private validateInput(jsonConfig: JsonConfig): JsonConfig {
    const jsonVarsSchema: Joi.ObjectSchema = Joi.object({
      dumpDatabase: Joi.object({
        username: Joi.string().default("postgres"),
        database: Joi.string().required(),
        password: Joi.string().required(),
        address: Joi.string().default("127.0.0.1"),
        port: Joi.string().default("5432"),
        pathPgDump: Joi.string().default("C:/Program Files/PostgreSQL/14/bin/pg_dump.exe"),
        databaseSaveToTmp: Joi.string().default("C:/BackupDataBase.backup")
      }),
      pathFileOrFolderForArchive: Joi.array().items(
        Joi.object({
          backupName: Joi.string().required(),
          paths: Joi.array().items(
            Joi.string()
          )
        })
      ),
      logFilePath: Joi.string().default("lastDateBackupLog.txt"),
      backupFrequency: Joi.number().required(),
      tempDirectoryPath: Joi.string().required(),
      storage: Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          type: Joi.string().valid(StorageTypeEnum.Synology, StorageTypeEnum.YandexDisk).required(),
          priority: Joi.number().integer().min(1).required(),
          tokenYandexDisk: Joi.string(),
          loginSynology: Joi.string(),
          passwordSynology: Joi.string(),
          domainSynology: Joi.string(),
          portSynology: Joi.number().default(5000)
        })
      )
    });

    const { error, value: validatedJsonConfig } =
      jsonVarsSchema.validate(jsonConfig);
    if (error) {
      this.logger.error(`Method validateInput(): ${error}`);
    }

    return validatedJsonConfig;
  }

  /**
   * Получить пользователя для базы данных
   */
  get username() {
    return this.jsonConfig.dumpDatabase.username;
  }

  /**
   * Получить название базы данных
   */
  get database() {
    return this.jsonConfig.dumpDatabase.database;
  }

  /**
   * Получить пароль для базы данных
   */
  get password() {
    return this.jsonConfig.dumpDatabase.password;
  }

  /**
   * Получить адрес для базы данных
   */
  get address() {
    return this.jsonConfig.dumpDatabase.address;
  }

  /**
   * Получить порт для базы данных
   */
  get port() {
    return this.jsonConfig.dumpDatabase.port;
  }

  /**
   * Получить путь располежение утилиты pg_dump
   * P.S. указывать с название pg_dump.exe
   */
  get pathPgDump() {
    return this.jsonConfig.dumpDatabase.pathPgDump;
  }

  /**
   * Получить путь куда будет сохранена база данных
   * P.S. указывать с названием бэкапа
   */
  get databaseSaveToTmp() {
    return this.jsonConfig.dumpDatabase.databaseSaveToTmp;
  }

  /**
   * Получить массив объекта конфигурации
   */
  get pathFileOrFolderForArchive() {
    return this.jsonConfig.pathFileOrFolderForArchive;
  }

  /**
   * Получить путь к файлу хранения последнего бэкапа
   */
  get logFilePath() {
    return this.jsonConfig.logFilePath;
  }

  /**
   * Получить путь к папке временого хранения файлов для отправки на ЯндексДиск
   */
  get tempDirectoryPath() {
    return this.jsonConfig.tempDirectoryPath;
  }

  /**
   * Получить число как часто проводить процедуру архивирования файлов и отправку этих файлов на ЯндексДиск
   */
  get backupFrequency() {
    return this.jsonConfig.backupFrequency;
  }

  /**
   * Получить токен ЯндексДиск
   */
  get tokenYandexDisk() {
    let result: string = "";
    this.jsonConfig.storage.forEach((elementStorage) => {
      result = elementStorage.tokenYandexDisk;
    });

    return result;
  }

  /**
   * Получить список всех хранилищ из файла config-application.json
   */
  get allStorage() {
    return this.jsonConfig.storage;
  }

  /**
   * Инициализировать уникальный массив приоритетов
   */
  initPriority() {
    for (const storage of this.jsonConfig.storage) {
      this.priorityArray.add(storage.priority);
    }
  }

  /**
   * Получить всех приоритеты в отсортированом списке
   */
  get allPriority() {
    return Array.from(this.priorityArray).sort();
  }

  /**
   * Получить список всех файлов на очередь загрузки
   */
  get queryPathFilesOnUpload(): string[] {
    return this._queryPathFilesOnUpload;
  }

  /**
   * Удалить файл из очереди загрузок
   * @param pathFile
   */
  deleteElementFromQueryPathFilesOnUpload(pathFile: string) {
    const indexRemoveElement = this.queryPathFilesOnUpload.indexOf(pathFile);
    if (indexRemoveElement > -1) {
      this.queryPathFilesOnUpload.splice(indexRemoveElement, 1);
    }
  }

  /**
   * Существует ли файл в очереде на загрузку
   * @param pathFile
   */
  existElementFromQueryPathFilesOnUpload(pathFile: string): boolean {
    const indexElement = this.queryPathFilesOnUpload.indexOf(pathFile);
    if (indexElement === -1) {
      return false;
    }
    return true;
  }

  /**
   * Получить первый элемент списка приоритетов
   */
  firstInArrayPriority() {
    return Array.from(this.priorityArray)[0];
  }

  /**
   * Удалить первый элемент списка приоритетов
   */
  deleteFirstElementArrayPriority():boolean {
    if(this.priorityArray.size <= 1 ){
      throw new Error("Закончились новые приоритетные хранилища")
    }
    this.priorityArray.delete(this.firstInArrayPriority())
    return true
  }

  /**
   * Добавить файл в список очередей загрузки
   * @param pathFile
   */
  addElementInArrayQueryPathFilesOnUpload(pathFile:string) {
    this.queryPathFilesOnUpload.push(pathFile)
  }
}
