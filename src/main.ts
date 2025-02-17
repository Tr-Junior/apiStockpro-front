import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { MessageService } from 'primeng/api';

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    MessageService,
    ...(appConfig.providers || [])
  ]
})
.catch(err => console.error(err));
