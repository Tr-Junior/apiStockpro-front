import { NgModule, Optional, SkipSelf } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

// Services
import { AuthService } from './guards/auth.service';
import { DataService } from './api/data.service';
import { ImportsService } from './api/imports.service';

// Guards
import { LoginGuard } from './guards/loginGuard.service';

@NgModule({
  imports: [
    HttpClientModule, // Importação do módulo HTTP
  ],
  providers: [
    AuthService,
    DataService,
    ImportsService,
    LoginGuard,
  ],
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule?: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule já foi carregado. Importe-o apenas no AppModule.');
    }
  }
}
