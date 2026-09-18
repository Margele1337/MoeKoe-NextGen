import { app, BrowserWindow } from 'electron';
console.log('SUCCESS: app =', typeof app, ', process.type =', process.type);
app.whenReady().then(() => {
  const win = new BrowserWindow({ width: 400, height: 300 });
  win.loadURL('data:text/html,<h1>Electron works!</h1>');
  console.log('Window created!');
  setTimeout(() => app.quit(), 3000);
});
