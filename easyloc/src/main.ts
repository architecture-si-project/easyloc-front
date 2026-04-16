import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const isDarkMode = savedTheme ? savedTheme === 'dark' : prefersDark;

document.documentElement.classList.toggle('dark', isDarkMode);
document.body?.classList.toggle('dark-mode', isDarkMode);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
