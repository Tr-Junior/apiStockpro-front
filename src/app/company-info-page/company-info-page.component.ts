import { Component } from '@angular/core';
import { DataService } from '../../services/data.service';
import { ImportsService } from '../../services/imports.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ICompany } from '../../models/company.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-company-info-page',
  standalone: true,
  imports: [ImportsService.imports],
  providers: [ImportsService.providers, DataService, MessageService],
  templateUrl: './company-info-page.component.html',
  styleUrls: ['./company-info-page.component.css']
})
export class CompanyInfoPageComponent {
  public company: ICompany[] = [];
  public isLoading: boolean = true;
  public editMode: boolean = false; // Controle do modo de edição
  public form: FormGroup;
  public busy = false;
  isEditing = false;


  constructor(
    private service: DataService,
    private messageService: MessageService,
    private fb: FormBuilder,
    private confirmationService: ConfirmationService
  ) {
    this.form = this.fb.group({
      nome: [''],
      cnpj: [''],
      endereco: this.fb.group({
        cep: [''],
        logradouro: [''],
        bairro: [''],
        cidade: [''],
        estado: [''],
        numero: [''],
        complemento: ['']
      }),
      contatos: this.fb.group({
        telefone: [''],
        email: ['']
      }),
      configuracoes: this.fb.group({
        abertura: [''],
        fechamento: [''],
        quantidadeCaixas: ['']
      })
    });
  }

  ngOnInit(): void {
    this.listCompany();
  }

  listCompany() {
    this.busy = true;
    this.service.getCompany().subscribe({
      next: (data: ICompany[]) => {
        console.log('Dados recebidos:', data);  // Verifique o que está sendo retornado
        this.busy = false;
        this.company = data; // Apenas atribui os dados sem adicionar o estado isEditing
      },
      error: (err: any) => {
        this.busy = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.message });
      }
    });
  }



  toggleEdit(loja: any) {
    this.isEditing = true;
    // Aqui você pode fazer algo mais, como preencher o formulário com os dados de "loja" para edição.
  }


  saveChanges(id: any) {
    if (this.form.invalid) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Preencha corretamente todos os campos' });
      return;
    }

    this.busy = true;
    //const formData = this.form.value; // Pega todos os valores do formulário
    this.service.updateCompany(id).subscribe(
      () => {
        this.busy = false;
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Alterações salvas com sucesso!' });
        //this.resetForm();
      },
      (error) => {
        this.busy = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível salvar as alterações.' });
        console.error('Erro ao salvar alterações:', error);
      }
    );
  }



  cancelEdit() {
    this.isEditing = false;
    this.listCompany(); // Recarrega os dados originais
  }
}
