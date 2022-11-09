import { Injectable, Logger } from "@nestjs/common";
import * as fs from "fs";
import * as Joi from "joi";
import { JsonConfig } from "../interface/JsonConfig.interface";

/**
 * Сервис для создания и чтения сущности конфигураций
 */
@Injectable()
export class ConfigService {
  /**
   * Поле класса хранит в себе информацию о конфигурации приложения из файла конфигурации
   * @private
   */
  private readonly jsonConfig: JsonConfig;
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
            Joi.string().required()
          )
        })
      ),
      logFilePath: Joi.string().default("lastDateBackupLog.txt"),
      tokenYandexDisk: Joi.string().required(),
      backupFrequency: Joi.number().required(),
      tempDirectoryPath: Joi.string().required()

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
    return this.jsonConfig.tokenYandexDisk;
  }

}
