import { StorageTypeEnum } from "../enum/StorageType.enum";

/**
 * Класс для передачи информации о хранилищах внутри приложение
 */
export class StorageDto {
  /**
   * Любое название хранилще
   */
  readonly name: string;
  /**
   * Тип хранилище Яндекс или Synology
   */
  readonly type: StorageTypeEnum;
  /**
   * Приоритет чем ниже число тем выше приоритет
   */
  readonly priority: number;
  /**
   * Поле хранит в себе информацию о токене личного кабинета ЯндексДиска
   */
  readonly tokenYandexDisk: string;
  /**
   * Логин к хранилищу Synology
   */
  readonly loginSynology: string;
  /**
   * Пароль к хранилищу Synology
   */
  readonly passwordSynology: string;
  /**
   * Адрес к хранилищу Synology
   */
  readonly domainSynology: string;
  /**
   * Порт к хранилищу Synology
   */
  readonly portSynology: number;
}