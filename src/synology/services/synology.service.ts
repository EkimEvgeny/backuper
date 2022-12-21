import { Injectable, Logger } from "@nestjs/common";
import { StorageInterface } from "../../interface/Storage.interface";

@Injectable()
export class SynologyService implements StorageInterface {

  private readonly logger = new Logger(SynologyService.name);

  //todo Auth method
  loginSynology(login:string, password:string){

  }


  //todo create folder
  createFolderStorage() {
  }

  //todo существует ли папка
  isFolderExistStorage(nameFolderStorage: string): Promise<boolean> {
    return Promise.resolve(false);
  }

  //todo uploading method
  uploadFileToFolderStorage() {
  }


}
