import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PasswordModule } from 'primeng/password';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { Security } from '../../../../utils/Security.util';
import { DataService } from '../../../../../core/api/data.service';
import { environment } from '../../../../environments/environment.development';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../../../../core/guards/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, PasswordModule, InputTextModule, ButtonModule, HttpClientModule],
  providers: [DataService, AuthService],  // Módulos diretamente importados
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css'] // Corrigido de 'styleUrl' para 'styleUrls'
})
export class LoginPageComponent {
  public form: FormGroup;
  public busy = false;
  public mode: string = environment.mode;

  constructor(
    private router: Router,
    private service: DataService,
    private fb: FormBuilder,
    private authService: AuthService
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
      this
        .service
        .refreshToken()
        .subscribe(
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
      return;
    }

    this.busy = true;
    this
      .service
      .authenticate(this.form.value)
      .subscribe(
        (data: any) => {
          this.busy = false;
          this.setUser(data.user, data.token);
        },
        (err) => {
          console.log(err);
          this.busy = false;
        }
      );
  }

  setUser(user: any, token: any) {
    // Após autenticar o usuário e obter o token e os dados do usuário
    const sessionId = user._id; // ou qualquer identificador único
    Security.setSessionId(sessionId);
    Security.set(user, token);
    this.router.navigate(['/store']);
  }
}
