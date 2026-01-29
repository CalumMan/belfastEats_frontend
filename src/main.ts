import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/services/auth.interceptor';

bootstrapApplication(App, {
  ...appConfig,
  providers: [
    ...(appConfig.providers ?? []),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
}).catch((err) => console.error(err));
