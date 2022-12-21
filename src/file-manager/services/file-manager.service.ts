import { Injectable, Logger } from "@nestjs/common";
import * as fs from "fs";
import * as dayjs from "dayjs";
import { Dayjs } from "dayjs";
import { fsync } from "fs";
import { ConfigService } from "../../config/service/config.service";

/**
 * Класс для редактирования и создания файлов с логами
 */
@Injectable()
export class FileManagerService {
  /**
   * Поле класса хранит в себе информацию об ошибках в приложении
   * @private
   */
  private readonly logger = new Logger(FileManagerService.name);

  /**
   * Создать файл, если создан то проигнарировать
   * @param path
   */
  createFileLog(path: string) {
    try {
      const dataFile = fs.readFileSync(path, "utf-8");
      if (!dataFile) {
        fs.openSync(path, "w");
      }
    } catch (error) {
      if (error) this.logger.error(`Method createFileLog(): ${JSON.stringify(error)}`);
    }
  }

  /**
   * Записать в файл строку
   * @param path
   */
  writeFileLog(path: string) {
    try {
      fs.writeFileSync(path, dayjs().format("YYYY-MM-DD HH:mm"));
    } catch (error) {
      this.logger.error(`Method writeFileLog(): ${JSON.stringify(error)}`);
    }
  }

  /**
   * Получить разницу в во времени с последнего бэкапа в миллисекундах
   * @param path
   */
  lastDateBackupDifference(path: string, diff: number): number {
    let result: number = 1;

    const lastBackupFromFile = fs.readFileSync(path, "utf8");

    const lastBackup: Dayjs = dayjs(lastBackupFromFile);
    const sumLastBackupAndDifference = lastBackup.clone().add(diff);

    if (dayjs().isBefore(sumLastBackupAndDifference)) {
      result = sumLastBackupAndDifference.valueOf() - dayjs().valueOf();
    }

    return Math.abs(result);
  }

  /**
   * Удалить файл
   * @param path
   */
  deleteFile(path: string) {
    try {
      fs.unlinkSync(path);
    } catch (error) {
      this.logger.error(`Method deleteFile(): ${JSON.stringify(error)}`);
    }
  }

  /**
   * Создать папку
   * @param path
   */
  createFolder(path: string) {
    try {
      fs.mkdirSync(path);
    } catch (error) {
      this.logger.error(`Method createFolder(): ${JSON.stringify(error)}`);
    }
  }

  /**
   * Проверка пуста ли папка
   * @param path
   */
  isEmptyFolder(path: string): boolean {
    try {
      const files = fs.readdirSync(path);
      if (files.length === 0) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      this.logger.error(`Method isEmptyFolder(): ${JSON.stringify(error)}`);
      return false;
    }
  }

  /**
   * Убалить пустую папку
   * @param path
   */
  deleteEmptyFolder(path: string) {
    fs.rmdir(path, (error) => {
      if (error)
        this.logger.error(`Method deleteEmptyFolder(): ${JSON.stringify(error)}`);
    });
  }

  isFolderExist(nameFolder: string,TmpFolder:string):boolean {

    try {
      const files = fs.readdirSync(TmpFolder);
      return files.includes(nameFolder);
    }catch (error) {
      this.logger.error(`Method isFolderExistInTmp(): ${JSON.stringify(error)}`);
      return false
    }

  }
}
