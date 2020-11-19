"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const electron_1 = require("electron");
const path = require("path");
const url = require("url");
const pkcs11js = require("pkcs11js");
let win = null;
var pkcs11;
function createWindow() {
    const electronScreen = electron_1.screen;
    const size = electronScreen.getPrimaryDisplay().workAreaSize;
    // Create the browser window.
    win = new electron_1.BrowserWindow({
        // x: 0,
        // y: 0,
        // width: size.width,
        // height: size.height,
        width: 800,
        height: 600,
        webPreferences: {
            // webSecurity: false,
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true // true if you want to run 2e2 test  with Spectron or use remote module in renderer context (ie. Angular)
        },
    });
    win.webContents.openDevTools();
    win.loadURL(url.format({
        pathname: path.join(__dirname, `../../dist/index.html`),
        protocol: 'file:',
        slashes: true
    }));
    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store window
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
    });
    return win;
}
try {
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
    electron_1.app.on('ready', () => setTimeout(createWindow, 400));
    // Quit when all windows are closed.
    electron_1.app.on('window-all-closed', () => {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== 'darwin') {
            electron_1.app.quit();
        }
    });
    electron_1.app.on('activate', () => {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (win === null) {
            createWindow();
        }
    });
    // app.on('select-client-certificate', (event, webContents, url, list, callback) => {
    //     event.preventDefault();
    //     console.log(event, 'event');
    //     console.log(webContents, 'webContents');
    //     console.log(url, 'url');
    //     console.log(list, 'list');
    //     win.webContents.send("getTokenData", [event, webContents, url, list, callback]);
    //     callback(list[0]);
    // });
    electron_1.app.on('select-client-certificate', (event, webContents, url, list, callback) => {
        console.log('select-client-certificate', url, list);
        event.preventDefault();
        electron_1.ipcMain.once('client-certificate-selected', (event, item) => {
            console.log('selected:', item);
            callback(item);
        });
        win.webContents.send('getTokenData', list);
    });
    electron_1.app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
        console.log('certificate-error', url);
        event.preventDefault();
        //     const result = ... // do your validation here
        // callback(result)
    });
    electron_1.app.on('login', (event, webContents, details, authInfo, callback) => {
        console.log('login');
        event.preventDefault();
        // callback('username', 'secret')
    });
    electron_1.app.on('will-quit', (event) => {
        console.log('will-quit');
    });
    electron_1.ipcMain.on('getDataToken', (event, arg) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            console.log('getDataToken1');
            pkcs11 = new pkcs11js.PKCS11();
            // console.log('pkcs11', pkcs11)
            let dllPath = path.join(__dirname, `../lib/eps2003csp11.dll`);
            pkcs11.load(dllPath);
            // console.log('loaded');
            pkcs11.C_Initialize();
            let token_info;
            // Getting info about PKCS11 Module
            var module_info = pkcs11.C_GetInfo();
            // console.log(module_info, 'module_info');
            // Getting list of slots
            var slots = pkcs11.C_GetSlotList(true);
            // console.log(slots, 'slots');
            var slot = slots[0];
            // console.log(slot, 'slot')
            // // Getting info about slot
            var slot_info = pkcs11.C_GetSlotInfo(slot);
            // console.log(slot_info, 'slot_info');
            // Getting info about token
            token_info = pkcs11.C_GetTokenInfo(slot);
            // console.log(token_info, 'token_info');
            // Getting info about Mechanism
            var mechs = pkcs11.C_GetMechanismList(slot);
            // console.log(mechs, 'mechs');
            var mech_info = pkcs11.C_GetMechanismInfo(slot, mechs[0]);
            // console.log(mech_info, 'mech_info');
            var session = pkcs11.C_OpenSession(slot, pkcs11js.CKF_RW_SESSION | pkcs11js.CKF_SERIAL_SESSION);
            console.log(session, 'session');
            // let seJson = Buffer.from(session).toJSON();
            // console.log(seJson.data, 'seJson')
            // Getting info about Session
            var info = pkcs11.C_GetSessionInfo(session);
            pkcs11.C_Login(session, 1, "11112222");
            /**
            * Your app code here
            */
            // let driveKey = pkcs11.C_DeriveKey()
            // console.log(driveKey, 'driveKey');
            const publicKeyTemplate = [
                { type: pkcs11js.CKA_CLASS, value: pkcs11js.CKO_PUBLIC_KEY },
                { type: pkcs11js.CKA_TOKEN, value: false },
                { type: pkcs11js.CKA_LABEL, value: 'My RSA Public Key' },
                { type: pkcs11js.CKA_PUBLIC_EXPONENT, value: Buffer.from([1, 0, 1]) },
                { type: pkcs11js.CKA_MODULUS_BITS, value: 2048 },
                { type: pkcs11js.CKA_VERIFY, value: true }
            ];
            const privateKeyTemplate = [
                { type: pkcs11js.CKA_CLASS, value: pkcs11js.CKO_PRIVATE_KEY },
                { type: pkcs11js.CKA_TOKEN, value: false },
                { type: pkcs11js.CKA_LABEL, value: 'My RSA Private Key' },
                { type: pkcs11js.CKA_SIGN, value: true },
            ];
            const keys = pkcs11.C_GenerateKeyPair(session, { mechanism: pkcs11js.CKM_RSA_PKCS_KEY_PAIR_GEN }, publicKeyTemplate, privateKeyTemplate);
            console.log('Keys generated: ' + JSON.stringify(keys));
            var template = [
                { type: pkcs11js.CKA_CLASS, value: pkcs11js.CKO_SECRET_KEY },
                { type: pkcs11js.CKA_TOKEN, value: false },
                { type: pkcs11js.CKA_LABEL, value: "My AES Key" },
                { type: pkcs11js.CKA_VALUE_LEN, value: 256 / 8 },
                { type: pkcs11js.CKA_ENCRYPT, value: true },
                { type: pkcs11js.CKA_DECRYPT, value: true },
            ];
            var key = pkcs11.C_GenerateKey(session, { mechanism: pkcs11js.CKM_AES_KEY_GEN }, template);
            console.log('Key generated: ' + JSON.stringify(key));
            // var publicKeyTemplate = [
            //     { type: pkcs11js.CKA_CLASS, value: pkcs11js.CKO_PUBLIC_KEY },
            //     { type: pkcs11js.CKA_TOKEN, value: false },
            //     { type: pkcs11js.CKA_LABEL, value: "My RSA Public Key" },
            //     { type: pkcs11js.CKA_PUBLIC_EXPONENT, value: new Buffer([1, 0, 1]) },
            //     { type: pkcs11js.CKA_MODULUS_BITS, value: 2048 },
            //     { type: pkcs11js.CKA_VERIFY, value: true }
            // ];
            // var privateKeyTemplate = [
            //     { type: pkcs11js.CKA_CLASS, value: pkcs11js.CKO_PRIVATE_KEY },
            //     { type: pkcs11js.CKA_TOKEN, value: false },
            //     { type: pkcs11js.CKA_LABEL, value: "My RSA Private Key" },
            //     { type: pkcs11js.CKA_SIGN, value: true },
            // ];
            // let newKeyPair = pkcs11.C_GenerateKeyPair(session, { mechanism: pkcs11js.CKM_RSA_PKCS_KEY_PAIR_GEN }, publicKeyTemplate, privateKeyTemplate);
            // console.log(newKeyPair, 'newKeyPair');
            // var nObject = pkcs11.C_CreateObject(session, [
            //     { type: pkcs11js.CKA_CLASS, value: pkcs11js.CKO_DATA },
            //     { type: pkcs11js.CKA_TOKEN, value: false },
            //     { type: pkcs11js.CKA_PRIVATE, value: false },
            //     { type: pkcs11js.CKA_LABEL, value: "My custom data" },
            // ]);
            // let C_GetAttributeValue = pkcs11.C_GetAttributeValue(session, nObject, [
            //     { type: pkcs11js.CKA_LABEL },
            //     { type: pkcs11js.CKA_TOKEN }
            // ]);
            // console.log(C_GetAttributeValue, 'C_GetAttributeValue');
            // const _pkcs11FindObjects = (pkcs11, pkcs11Session, pkcs11Template) => {
            //     pkcs11.C_FindObjectsInit(pkcs11Session, pkcs11Template);
            //     var objs = [];
            //     var obj = pkcs11.C_FindObjects(pkcs11Session);
            //     while (obj) {
            //         objs.push(obj);
            //         obj = pkcs11.C_FindObjects(pkcs11Session);
            //     }
            //     pkcs11.C_FindObjectsFinal(pkcs11Session);
            //     return objs;
            // }
            // let PrivKeysHandle = _pkcs11FindObjects(pkcs11, session, [
            //     { type: pkcs11js.CKA_CLASS, value: pkcs11js.CKO_PRIVATE_KEY },
            //     { type: pkcs11js.CKA_TOKEN, value: true },
            //     { type: pkcs11js.CKA_LABEL, value: "mylabel" },
            // ])
            // console.log(PrivKeysHandle, 'PrivKeysHandle')
            // Get public_key_id...
            // let publicKeyId = pkcs11.C_GetAttributeValue(session, PrivKeysHandle[0], [{ type: 0x129 }])
            // console.log('publicKey', token_info)
            pkcs11.C_Logout(session);
            pkcs11.C_CloseSession(session);
            win.webContents.send('getDataTokenRes', token_info);
        }
        catch (e) {
            console.error(e, 'error');
        }
        finally {
            pkcs11.C_Finalize();
        }
    }));
}
catch (e) {
    // Catch Error
    // throw e;
}
//# sourceMappingURL=main.js.map