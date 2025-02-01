import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Security } from '../../../../utils/Security.util';
import { ImportsService } from '../../../../../core/services/imports.service';
import { DataService } from '../../../../../core/services/data.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login-sales',
  standalone: true,
  imports: [ImportsService.imports],
  providers: [ImportsService.providers, DataService, MessageService],
  templateUrl: './login-sales.component.html',
  styleUrls: ['./login-sales.component.css']
})
export class LoginModalComponent {
  username: string = '';
  password: string = '';

  constructor(
    private router: Router,
    private messageService: MessageService
  ) {}

  @ViewChild('passwordInput') passwordInput!: ElementRef;

  ngAfterViewInit() {
    this.passwordInput.nativeElement.focus();
  }

  ngOnInit(): void {
    this.clear();
  }

  login() {
    const storedUser = Security.getUser();
    if (storedUser) {
      const tokenPassword = storedUser.pass;
      if (this.password === tokenPassword) {
        Security.setPass(storedUser);
        // Obter a rota de destino armazenada anteriormente
        const redirectRoute = sessionStorage.getItem('redirectRoute');
        if (redirectRoute) {
          this.router.navigate([redirectRoute]);
          sessionStorage.removeItem('redirectRoute');
        } else {
          this.router.navigate(['/']);
        }
      } else {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Credenciais inválidas. Por favor, tente novamente.' });
      }
    } else {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Usuário não autenticado. Por favor, faça login.' });
      this.router.navigate(['/login']);
    }
  }

  setPass(user: any) {
    Security.setPass(user);
  }

  clear() {
    Security.clearPass();
  }
}
