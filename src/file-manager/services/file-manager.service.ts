import { Injectable, Logger } from "@nestjs/common";
import * as fs from "fs";
import * as dayjs from "dayjs";
import { Dayjs } from "dayjs";

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
  createFileLog(path:string){
    fs.readFile(path,"utf8",(err, data) => {
      if(!data){
        fs.open(path, 'w', (error) => {
          if(error) this.logger.error(`Method createFileLog(): ${err}`);
        });
      }
    });
  }

  /**
   * Записать в файл строку
   * @param path
   */
  writeFileLog(path:string){
    fs.writeFile(path, dayjs().format('YYYY-MM-DD HH:mm'), (err) => {
      if(err) this.logger.error(`Method writeFileLog(): ${err}`);
    });
  }

  /**
   * Получить разницу в во времени с последнего бэкапа в миллисекундах
   * @param path
   */
  lastDateBackupDifference(path: string, diff:number): number{
    let result: number = 1

    const lastBackupFromFile = fs.readFileSync(path,"utf8");

    const lastBackup: Dayjs = dayjs(lastBackupFromFile);
    const sumLastBackupAndDifference = lastBackup.clone().add(diff);

    if(dayjs().isBefore(sumLastBackupAndDifference)) {
      result = sumLastBackupAndDifference.valueOf() - dayjs().valueOf();
    }

    return Math.abs(result);
  }

  /**
   * Удалить файл
   * @param path
   */
  deleteFile(path:string){
    fs.unlink(path, (err) => {
      if(err) this.logger.error(`Method deleteFile(): ${err}`);
    });
  }

}
