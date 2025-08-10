// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

/*
contextBridge.exposeInMainWorld('filesystem', {
  loadfont: () => ipcRenderer.invoke('loadfont')
  // we can also expose variables, not just functions
})*/

let win = window as any

win.filesystem = {
     loadfont: () => ipcRenderer.invoke('loadfont'),
     getAppPath: () => ipcRenderer.invoke('getAppPath'),
}