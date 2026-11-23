/* GESTION D'ENTREPRISE — application Windows : une fenêtre qui affiche l'application (dossier www) */
const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');
if (!app.requestSingleInstanceLock()) app.quit();
let win;
function creer() {
  win = new BrowserWindow({
    width: 1280, height: 860, minWidth: 380, minHeight: 500,
    title: "GESTION D'ENTREPRISE", backgroundColor: '#f4f1ec', autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true, spellcheck: true }
  });
  Menu.setApplicationMenu(null);
  // liens externes (WhatsApp, GitHub, mises à jour) : ouverts dans le navigateur de l'ordinateur
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^(https?|mailto|tel):/i.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file:')) { e.preventDefault(); shell.openExternal(url); } });
  win.loadFile(path.join(__dirname, 'www', 'index.html'));
}
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(creer);
app.on('window-all-closed', () => app.quit());
