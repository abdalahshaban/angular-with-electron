import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  constructor(private _electronService: ElectronService) {
    this.getTokenData();

    this._electronService.ipcRenderer.on('getDataTokenRes', (event, arg) => {
      console.log(event, 'event getDataTokenRes');
      console.log(arg, 'arg getDataTokenRes');
    })

  }

  requestToken() {
    alert('insert hard token');
    console.log(this._electronService.isWindows, 'isWindows');
    this._electronService.ipcRenderer.send('getDataToken')
    this._electronService.ipcRenderer.send("getPublicKey")
  }

  getTokenData() {
    this._electronService.ipcRenderer.on('getTokenData', (event, data) => {
      console.log(event, 'event in services');
      console.log(data, 'data');

    });
  }


}
