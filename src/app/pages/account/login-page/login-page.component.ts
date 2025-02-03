import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PasswordModule } from 'primeng/password';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { Security } from '../../../../utils/Security.util';
import { environment } from '../../../../environments/environment.development';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../../../core/guards/auth.service';
import { AuthenticateService } from '../../../../core/api/authenticate/authenticate.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, PasswordModule, InputTextModule, ButtonModule, HttpClientModule, ToastModule],
  providers: [AuthService, MessageService],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent {
  public form: FormGroup;
  public busy = false;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private authenticateService: AuthenticateService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const token = Security.getToken();
    if (token) {
      this.busy = true;
      this.authenticateService.refreshToken().subscribe(
        (data: any) => {
          this.busy = false;
          this.setUser(data.user, data.token);
        },
        (err) => {
          localStorage.clear();
          this.busy = false;
        }
      );
    }
  }

  submit() {
    if (this.form.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Preencha todos os campos' });
      return;
    }

    this.busy = true;
    this.authenticateService.authenticate(this.form.value).subscribe(
      (data: any) => {
        this.busy = false;
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Login efetuado com sucesso!' });
        this.setUser(data.user, data.token);
      },
      (err) => {
        this.busy = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Usuário ou senha inválidos!' });
      }
    );
  }

  setUser(user: any, token: any) {
    Security.setSessionId(user._id);
    Security.set(user, token);
    this.router.navigate(['/store']);
  }
}
