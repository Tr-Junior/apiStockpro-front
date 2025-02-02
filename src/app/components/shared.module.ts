import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Pipes e Diretivas
//import { CurrencyPipe } from './pipes/currency.pipe';
//import { HighlightDirective } from './directives/highlight.directive';

// Componentes compartilhados
import { NavbarComponent } from './shared/navbar/navbar.component';
import { LoadingComponent } from './shared/loading/loading.component';

@NgModule({
  declarations: [
    //CurrencyPipe,
    //HighlightDirective,

  ],
  imports: [
    CommonModule,
    NavbarComponent,
    LoadingComponent
  ],
  exports: [
    //CurrencyPipe,
    //HighlightDirective,
    NavbarComponent,
    LoadingComponent
  ]
})
export class SharedModule { }
