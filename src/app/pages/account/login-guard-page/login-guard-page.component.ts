import { Component, OnDestroy } from '@angular/core';
import { Security } from '../../../../utils/Security.util';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DataService } from '../../../../core/api/data.service';
import { ImportsService } from '../../../../core/api/imports.service';
import { AuthService } from '../../../../core/guards/auth.service';

@Component({
  selector: 'app-login-guard-page',
  standalone: true,
  imports: [ImportsService.imports],
  providers: [ImportsService.providers, DataService, MessageService],
  templateUrl: './login-guard-page.component.html',
  styleUrl: './login-guard-page.component.css'
})
export class LoginGuardPageComponent implements OnDestroy{
  password: string = '';
  errorMessage: string = '';
  userId: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private service: DataService
  ) {}

  ngOnInit() {
    // Obtém o ID do usuário do token armazenado
    const user = Security.getUser();
    if (user) {
      this.userId = user._id;
    } else {
      this.router.navigate(['/login']);
    }
  }

  login() {
    if (!this.password) {
      this.errorMessage = 'Digite sua senha!';
      return;
    }

    const requestData = {
      userId: this.userId,
      password: this.password
    };

    this.service.validatePassword(requestData).subscribe(response => {
      if (response.valid) {
        sessionStorage.setItem('auth-guard', 'true');

        // Recupera a rota original que o usuário tentou acessar
        const redirectUrl = sessionStorage.getItem('redirectAfterLoginGuard') || '/sales';
        sessionStorage.removeItem('redirectAfterLoginGuard'); // Remove para evitar redirecionamento indevido

        this.router.navigate([redirectUrl]);
      } else {
        this.errorMessage = 'Senha incorreta!';
      }
    }, error => {
      this.errorMessage = 'Erro ao validar senha!';
    });
  }

  ngOnDestroy() {
    // Limpa a chave 'auth-guard' quando o componente for destruído
    sessionStorage.removeItem('auth-guard');
  }
}
