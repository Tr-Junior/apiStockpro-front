import { Component } from '@angular/core';
import { DataService } from '../../../../services/data.service';
import { ImportsService } from '../../../../services/imports.service';
import { ConfirmationService } from 'primeng/api/confirmationservice';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { User } from '../../../../models/user.model';

@Component({
  selector: 'app-new-user-page',
  standalone: true,
  imports: [ImportsService.imports],
  providers: [ImportsService.providers, DataService],
  templateUrl: './new-user-page.component.html',
  styleUrl: './new-user-page.component.css'
})
export class NewUserPageComponent {
  public busy = false;
  public user: User[] = [];
  public form: FormGroup;
  public roles: any[] = [
    { label: 'Usuário', value: 'user' },
    { label: 'Administrador', value: 'admin' },
  ];

  constructor(
    private messageService: MessageService,
    private service: DataService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group(
      {
        name: ['', Validators.compose([Validators.required])],
        password: ['', Validators.compose([Validators.required])],
        confirmarSenha: ['', Validators.compose([Validators.required])],
        pass: ['', Validators.compose([Validators.required])],
        roles: ['', Validators.compose([Validators.required])],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit() {}

  resetForm() {
    this.form.reset();
  }

  refresh(): void {
    window.location.reload();
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmarSenha = form.get('confirmarSenha')?.value;
    return password === confirmarSenha ? null : { mismatch: true };
  }

  submit() {
    if (this.form.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Preencha corretamente todos os campos',
      });
      return;
    }

    this.busy = true;

    const newName = this.form.value.name;

    // Verificar se o usuário com o mesmo nome já existe
    this.service.checkUsernameExists(newName).subscribe({
      next: (exists: boolean) => {
        if (exists) {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Nome de usuário já existe',
          });
          this.busy = false;
        } else {
          // Criar um novo usuário
          const newUser = new User(
            '', // O ID será gerado automaticamente pelo backend
            this.form.value.name,
            this.form.value.password,
            this.form.value.pass,
            this.form.value.roles
          );

          this.service.createUser(newUser).subscribe({
            next: (data: any) => {
              this.busy = false;
              this.messageService.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: data.message,
              });
              this.resetForm();
            },
            error: (err: any) => {
              console.log(err);
              this.busy = false;
            },
          });
        }
      },
      error: (err: any) => {
        console.log(err);
        this.busy = false;
      },
    });
  }
}
