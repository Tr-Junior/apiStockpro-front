import { Component } from '@angular/core';
import { ImportsService } from '../../../../services/imports.service';
import { DataService } from '../../../../services/data.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ProductsBuy } from '../../../../models/productsBuy-model';
import { MessageService, SelectItem } from 'primeng/api';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-buy-page',
  standalone: true,
  imports: [ImportsService.imports],
  providers: [ImportsService.providers, DataService],
  templateUrl: './buy-page.component.html',
  styleUrl: './buy-page.component.css'
})
export class BuyPageComponent {
  public productsBuy: ProductsBuy[] = [];
  public busy = false;
  public status: SelectItem[] = [];
  public form: FormGroup;
  selectedProducts: any[] = [];
  metaKeySelection: boolean = false;
  public searchQuery: string = '';

  constructor(
    private service: DataService,
    private fb: FormBuilder,
    private messageService: MessageService // Removido ToastrService
  ) {
    this.status = this.getStatus().map(option => ({ label: option, value: option })).sort((a, b) => a.label.localeCompare(b.label));
    this.form = this.fb.group({
      title: ['', Validators.compose([
        Validators.required
      ])],
    });
  }

  onRowEditInit(product: any) {
    this.messageService.add({ severity: 'info', summary: 'Edição de tabela iniciada', detail: product.title });
  }

  onRowEditSave(product: any) {
    console.log('Produto antes do envio:', product);

    const updatedProduct = {
      id: product._id,
      title: product.title
    };

    this.service.updateProductBuy(updatedProduct).subscribe(
      () => {
        this.loadProducts();
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Produto atualizado com sucesso.' });
      },
      error => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao atualizar produto.' });
        console.error('Erro de atualização:', error);
      }
    );
  }

  onRowEditCancel(product: any, index: number) {
    this.messageService.add({ severity: 'warn', summary: 'Edição cancelada', detail: product.title });
  }

  ngOnInit() {
    this.loadProducts();
  }

  getStatus(): string[] {
    return ['A fazer', 'Pedido feito'];
  }

  loadProducts() {
    this.busy = true;
    this.service.getProductBuy().subscribe(
      (data: any) => {
        this.productsBuy = data.sort((a: any, b: any) => {
          const statusComparison = a.status.toLowerCase().localeCompare(b.status.toLowerCase());
          if (statusComparison !== 0) {
            return statusComparison;
          }
          return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
        });
        this.busy = false;
      },
      error => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar produtos.' });
        this.busy = false;
      }
    );
  }

  submitForm() {
    if (this.form.valid) {
      this.submit();
    }
  }

  submit(): void {
    if (this.form.valid) {
      this.busy = true;

      // Adiciona o status "A fazer" aos valores do formulário
      const formValue = {
        ...this.form.value,
        status: 'A fazer'
      };

      this.service.createProductBuy(formValue).subscribe({
        next: (data: any) => {
          this.busy = false;
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: data.message });
          this.resetForm();
          this.loadProducts();
        },
        error: (err: HttpErrorResponse) => {
          console.error(err);
          this.busy = false;
          if (err.status === 400 && err.error.message) {
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.error.message });
          } else {
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao salvar o produto.' });
          }
        }
      });
    }
  }

  resetForm() {
    this.form.reset();
  }

  onEdit(event: any, product: ProductsBuy) {
    console.log('Produto antes do envio:', product);

    const updatedProduct = {
      id: product._id
    };

    this.service.updateProductBuy(updatedProduct).subscribe(
      () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Produto atualizado com sucesso.' });
        this.loadProducts();
      },
      error => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao atualizar produto.' });
        console.error('Erro de atualização:', error);
      }
    );
  }

  deleteProduct(id: any) {
    this.service.delProductBuy(id).subscribe(
      (data: any) => {
        this.busy = false;
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: data.message });
        this.loadProducts();
      },
      error => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao deletar produto.' });
      }
    );
  }

  deselectAll(): void {
    this.selectedProducts = [];
  }

  search(): void {
    if (!this.searchQuery) {
      this.loadProducts();
      return;
    }
    // Crie um objeto com o campo "title" contendo o termo de pesquisa
    const searchData = { title: this.searchQuery };

    this.service.searchProductBuy(searchData).subscribe({
      next: (data: any) => {
        this.productsBuy = data;
      },
      error: (err: any) => {
        console.log(err);
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.message });
      }
    });
  }

  deleteSelectedProducts() {
    if (this.selectedProducts && this.selectedProducts.length) {
      this.selectedProducts.forEach(product => {
        this.service.delProductBuy(product._id).subscribe(
          () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: `Produto ${product.title} excluído com sucesso.` });
            this.loadProducts(); // Recarregar os produtos após a exclusão
          },
          (error: HttpErrorResponse) => {
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: `Erro ao excluir produto: ${product.title}` });
            console.error('Erro:', error);
          }
        );
      });
      this.selectedProducts = []; // Limpa a seleção após a exclusão
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.loadProducts();
  }

}
