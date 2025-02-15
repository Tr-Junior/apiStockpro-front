import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { catchError, from, of } from 'rxjs';
import { Product } from '../../../../core/models/product.model';
import { Supplier } from '../../../../core/models/supplier-model';
import { ImportsService } from '../../../../core/services/imports.service';
import { ProductService } from '../../../../core/api/products/product.service';
import { SupplierService } from '../../../../core/api/supplier/suplier.service';

@Component({
  selector: 'app-product-registration-page',
  standalone: true,
  imports: [ImportsService.imports],
  providers: [ImportsService.providers],
  templateUrl: './product-registration-page.component.html',
  styleUrl: './product-registration-page.component.css'
})
export class ProductRegistrationPageComponent {
  @Input() products!: Product;
  public displayModal: boolean = false;
  public product: Product[] = [];
  public form: FormGroup;
  public busy = false;
  prodId = '';
  name: any;
  public selectedProduct: Product[] = [];
  public clonedProducts: { [s: string]: Product } = {};
  public suppliers: Supplier[] = [];
  public filteredSuppliers: Supplier[] = [];
  public selectedSupplier: Supplier | null = null;

  constructor(
    private productService: ProductService,
    private supplierService: SupplierService,
    private fb: FormBuilder,
    private messageService: MessageService // Usa o MessageService agora
  ) {
    this.form = this.fb.group({
      title: ['', Validators.compose([Validators.required])],
      quantity: ['', Validators.compose([Validators.required])],
      supplier: ['', Validators.compose([Validators.required])],
      purchasePrice: ['', Validators.compose([Validators.required])],
      price: ['', Validators.compose([Validators.required])],
    });
  }

  @Output() onCancel = new EventEmitter<void>();
  @Output() productSaved = new EventEmitter<void>();



  onSupplierSelect(event: any) {
    this.selectedSupplier = event.value || null;
    if (this.selectedSupplier) {
      this.form.patchValue({ supplier: this.selectedSupplier.name });
    } else {
      this.form.patchValue({ supplier: null });
    }
  }


  ngOnInit() {
    this.loadSuppliers();
  }

  resetForm() {
    this.form.reset();
    this.fecharModal();
    this.onCancel.emit();
  }

  refresh(): void {
    window.location.reload();
  }

  loadSuppliers() {
    this.supplierService
      .getSupplier()
      .pipe(
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao carregar fornecedores.',
          });
          console.error(error);
          return of([]); // Retorna array vazio em caso de erro
        })
      )
      .subscribe((data) => {
        this.suppliers = data;
      });
  }

  filterSuppliers(event: any) {
    const query = event.query.toLowerCase();
    this.filteredSuppliers = this.suppliers.filter((supplier) =>
      supplier.name.toLowerCase().includes(query)
    );
  }

  submit() {
    console.log(this.form)
    if (this.form.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Preencha os campos obrigatórios antes de salvar.',
      });
      return;
    }

    if (this.selectedSupplier) {
      this.form.patchValue({ supplier: this.selectedSupplier._id });
    }

    this.busy = true;

    this.productService.createProduct(this.form.value).subscribe({
      next: (data: any) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: data.message || 'Produto salvo com sucesso!',
        });
        this.productSaved.emit();
        this.resetForm();
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao salvar o produto.',
        });
        console.error('Erro:', err[0]);
      },
      complete: () => {
        this.busy = false;
        this.fecharModal();
      },
    });
  }

  // Método para fechar o modal
  fecharModal() {
    this.displayModal = false;
  }
}
