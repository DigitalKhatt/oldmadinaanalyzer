import { ipcMain, app } from 'electron';



export function addHandles(){
    ipcMain.handle('loadfont', (event, arg) => {
        // Read the contents of the local file using the fs module
        const fs = require('fs')
        const buffer = fs.readFileSync('/Users/amin/projects/digitalkhatt/oldmadinafont/output/DigitalKhattQuranic.otf').buffer       

        return buffer;
    });

     ipcMain.handle('getAppPath', (event, arg) => {
      
        const path = app.getAppPath()      

        return path;
    })
}