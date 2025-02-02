import { Component } from '@angular/core';
import { DataService } from '../../../../../core/api/data.service';
import { ImportsService } from '../../../../../core/api/imports.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Security } from '../../../../utils/Security.util';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [ImportsService.imports],
  providers: [ImportsService.providers, DataService, FormsModule, ReactiveFormsModule,],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.css'
})
export class UsersPageComponent {

  public form: FormGroup;
  public user: any;
  public busy = false;

  public roles: any[] = [
    { label: 'Administrador', value: 'admin' },
    { label: 'Usuário', value: 'user' }
  ];

  constructor(
    private service: DataService,
    private fb: FormBuilder,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      id: [{ value: '', disabled: true }],
      name: [{ value: '', disabled: true }],
      password: ['', Validators.required],
      pass: ['', Validators.required],
      confirmarSenha: ['', Validators.required],
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.user = Security.getUser();
    if (this.user) {
      this.getUserById(this.user._id);
    }
  }

  getUserById(id: string) {
    this.busy = true;
    this.service.getUserById(id).subscribe(
      (data: any) => {
        this.busy = false;
        this.form.controls['id'].setValue(data._id);
        this.form.controls['name'].setValue(data.name);
      },
      (err: any) => {
        console.error(err);
        this.busy = false;
      }
    );
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmarSenha = form.get('confirmarSenha')?.value;
    return password === confirmarSenha ? null : { mismatch: true };
  }

  submit() {
    if (this.form.invalid) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Preencha corretamente todos os campos' });
      return;
    }

    this.busy = true;
    const formData = {
      id: this.user._id,
      password: this.form.value.password,
      pass: this.form.value.pass
    };

    this.service.updatePassword(formData).subscribe(
      (data: any) => {
        this.busy = false;
        this.messageService.add({ severity: 'success', summary: 'Atualizado!', detail: data.message });
        this.resetForm();
      },
      (err: any) => {
        console.error(err);
        this.busy = false;
      }
    );
  }

  resetForm() {
    this.form.reset();
  }
}

