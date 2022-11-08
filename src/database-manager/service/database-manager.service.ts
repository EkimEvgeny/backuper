import { Injectable } from '@nestjs/common';
import * as fs from "fs";
import { exec } from "child_process";

/**
 * Сервис для работы с базой данных
 */
@Injectable()
export class DatabaseManagerService {

  /**
   * Создаёт бэкап базы данных postgres
   */
  async backupDataBase(){
    const { exec } = require('child_process');

    const configDataJson = fs.readFileSync('E:/node.js/Dev/backuper/config-application.json', 'utf8');
    const configFile = JSON.parse(configDataJson);
    const configPgDump = configFile['dumpDatabase']
    const pathPgDump = configPgDump['pathPgDump']
    const username = configPgDump['username']
    const password = configPgDump['password']
    const address = configPgDump['address']
    const port = configPgDump['port']
    const database = configPgDump['database']
    const databaseSaveToTmp = configPgDump['databaseSaveToTmp']


    const command = `\"${pathPgDump}\" -F c -d postgres://${username}:${password}@${address}:${port}/${database} > ${databaseSaveToTmp}`
    let yourscript = exec(command,
      (error, stdout, stderr) => {
        if (error !== null) {
          console.log(`exec error: ${error}`);
        }
      });
  }
}
