import { Component, Input} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Product} from '../../../../core/models/product.model';
import { Budget } from '../../../../core/models/budget.model';
import { Supplier } from '../../../../core/models/supplier-model';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { ImportsService } from '../../../../core/services/imports.service';
import * as XLSX from 'xlsx';
import { ProductRegistrationPageComponent } from '../product-registration-page/product-registration-page.component';
import { ProductService } from '../../../../core/api/products/product.service';
import { SupplierService } from '../../../../core/api/supplier/suplier.service';
import { BudgetService } from '../../../../core/api/budget/budget.service';
@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [ImportsService.imports, ProductRegistrationPageComponent],
  providers: [ImportsService.providers],
  templateUrl: './products-page.component.html',
  styleUrl: './products-page.component.css'
})
export class ProductsPageComponent {

  @Input() products!: Product;
  public form: FormGroup;
  public selectedProduct!: Product;
  public budgets: Budget[] = [];
  public product: Product[] = [];
  public searchQuery: string = '';
  public busy: boolean = false;
  public suppliers: Supplier[] = [];
  public filteredSuppliers: Supplier[] = [];
  public selectedSupplier: Supplier | null = null;
  public filteredProducts: Product[] = [];
  public currentPage: number = 1;
  public totalPages: number = 0;
  public searchQueryChanged = new Subject<string>();
  public isLoading: boolean = true;
  public allProductsLoaded: boolean = false;
  public page: number = 1;
  public total: number = 0
  public offset: number = 0
  public limit: number = 100
  displayDialog: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private supplierService: SupplierService,
    private budgetService: BudgetService,
    private messageService: MessageService,
    private fb: FormBuilder,
    private confirmationService: ConfirmationService
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      quantity: ['', Validators.required],
      min_quantity: ['', Validators.required],
      supplier: [''],
      purchasePrice: ['', Validators.required],
      price: ['', Validators.required]
    });
  }

  showDialog() {
    this.displayDialog = true;
  }

  closeDialog() {
    this.displayDialog = false;
  }


  ngOnInit(): void {
    this.listProd();
    this.searchQueryChanged.pipe(
      debounceTime(300), // Espera 300ms antes de buscar
      distinctUntilChanged(), // Evita chamadas duplicadas
      takeUntil(this.destroy$) // Cancela quando o componente for destruído
    ).subscribe(query => {
      this.searchQuery = query;
      this.search(1);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  listProd() {
    this.isLoading = true;
    this.productService.getProducts({ page: this.page, limit: this.limit }).subscribe({
      next: (data: any) => {
        this.product = data.data;
        this.total = data.totalItems;
        this.filteredProducts = [...this.product];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar produtos:', error);
        this.isLoading = false;
      }
    });
  }

  search(page: number = 1): void {
    if (!this.searchQuery.trim()) {
      this.clearSearch();
      return;
    }

    this.busy = true;
    const searchData = { title: this.searchQuery, page, limit: this.limit };
    this.productService.searchProduct(searchData).subscribe({
      next: (response: any) => {
        this.filteredProducts = response.products;
        this.total = response.totalRecords;
        this.totalPages = Math.ceil(response.totalRecords / this.limit);
        this.currentPage = page;
        this.offset = (page - 1) * this.limit;
        this.busy = false;
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao buscar produtos: ' + err.message,
        });
        this.busy = false;
      }
    });
  }

  onSearchInput(event: any) {
    this.searchQueryChanged.next(event.target.value); // Emite o valor para o Subject
  }

  pageChange(event: any) {
    this.limit = event.rows;
    this.page = Math.floor(event.first / event.rows) + 1;
    this.offset = event.first;

    if (this.searchQuery.trim()) {
      this.search(this.page);
    } else {
      this.listProd();
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.page = 1;
    this.offset = 0;
    this.allProductsLoaded = false;
    this.filteredProducts = [];
    this.listProd();
  }

  listBudget() {
    this.budgetService.getBudget().subscribe({
     next: (data: Budget[]) => {
        this.budgets = data;
      },
      error: (error) => console.error(error)
    });
  }

  loadSuppliers() {
    this.supplierService.getSupplier().subscribe({
    next: (data) => {
        this.suppliers = data;
      },
    error: (error) => {
        console.error('Erro ao carregar fornecedores:', error);
      }
    });
  }


  filterSuppliers(event: any) {
    const query = event.query.toLowerCase();
    this.filteredSuppliers = this.suppliers.filter(
      supplier => supplier.name.toLowerCase().includes(query)
    );
  }

  getQuantityInBudget(productId: string): { quantity: number, clients: string[] } {
    let quantity = 0;
    let clients = new Set<string>();

    this.budgets.forEach(budget => {
      budget.budget.items.forEach(item => {
        if (item.product === productId) {
          quantity += item.quantity;
          clients.add(budget.client);
        }
      });
    });

    return { quantity, clients: Array.from(clients) };
  }


  onRowEditInit(product: Product) {
    const quantityInBudget = this.getQuantityInBudget(product._id).quantity;

    this.selectedProduct = {
      ...product,
      quantity: product.quantity - quantityInBudget, // Quantidade restante para edição
    };

    this.form.patchValue({
      title: product.title,
      quantity: this.selectedProduct.quantity,
      supplier: product.supplier,
      purchasePrice: product.purchasePrice,
      price: product.price,
    });
  }


  onRowEditSave(product: Product) {
    // Verifica se o produto é válido
    if (!product || !product._id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Produto inválido ou não encontrado para salvar a edição.',
      });
      return;
    }

    const index = this.product.findIndex((p) => p?._id === product._id);
    if (index === -1) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Produto não encontrado na lista local.',
      });
      return;
    }

    const updatedProduct = { id: product._id, ...this.selectedProduct };

    this.productService.updateProduct(updatedProduct).subscribe({
      next: (data: any) => {
        this.product[index] = data.product; // Atualiza o produto na lista
        this.filteredProducts = [...this.product]; // Recarrega os produtos filtrados

        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: data.message,
        });

        if (this.searchQuery) {
          this.search(); // Aplica a pesquisa
        } else {
          this.listProd(); // Atualiza a lista completa
          this.loadSuppliers();
        }
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: err.message,
        });
      },
    });
  }


  onRowEditCancel(product: Product) {
    const index = this.product.findIndex((p) => p._id === product._id);
    this.product[index] = this.selectedProduct;

    // Atualiza o filtro de pesquisa
    if (this.searchQuery) {
      this.search; // Aplica a pesquisa novamente
    } else {
      this.listProd(); // Atualiza a lista completa
    }
  }


  deleteProduct(productId: string) {
    this.productService.deleteProduct(productId).subscribe({
      next: () => {
        // Remove o produto da lista local
        this.product = this.product.filter(p => p._id !== productId);
        this.filteredProducts = [...this.product]; // Atualiza os produtos filtrados
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Produto excluído com sucesso',
        });
        // Reaplica o filtro de pesquisa após a exclusão
        if (this.searchQuery) {
          this.search; // Aplica a pesquisa novamente
        } else {
          this.listProd(); // Atualiza a lista completa
        }
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao excluir o produto: ' + err.message,
        });
      },
    });
  }


  confirmDelete(productId: string) {
    this.confirmationService.confirm({
      icon: 'pi pi-exclamation-triangle',
      message: 'Tem certeza de que deseja excluir este produto?',
      header: 'Confirmar Exclusão',
      accept: () => {
        // Chama a função de exclusão se o usuário confirmar
        this.deleteProduct(productId);
      },
      reject: () => {
        // Não faz nada se o usuário cancelar
        console.log('Exclusão cancelada');
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Exclusão cancelada ',
        });
      }
    });
  }

      exportToExcel() {
        if (this.product.length === 0) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Aviso',
            detail: 'Nenhum produto disponível para exportar.',
          });
          return;
        }

        // Mapeia os produtos para o formato da tabela
        const dataToExport = this.product.map(product => ({
          ID: product._id,
          Nome: product.title,
          Quantidade: product.quantity,
          Fornecedor: product.supplier?.name || 'N/A',
          'Preço de Compra (R$)': product.purchasePrice.toFixed(2).replace('.', ','),
          'Preço de Venda (R$)': product.price.toFixed(2).replace('.', ','),
        }));

        // Cria a planilha e adiciona os dados
        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);

        // Ajusta largura das colunas
        const columnWidths = [
          { wch: 25 }, // ID
          { wch: 45 }, // Nome
          { wch: 12 }, // Quantidade
          { wch: 15 }, // Fornecedor
          { wch: 20 }, // Preço de Compra
          { wch: 20 }, // Preço de Venda
        ];
        worksheet['!cols'] = columnWidths;

        // Adiciona cabeçalhos com estilo
        const headerStyle = {
          font: { bold: true, sz: 12 }, // Negrito e tamanho 12
          alignment: { horizontal: 'center' }, // Alinhamento centralizado
          fill: { fgColor: { rgb: 'FFD700' } }, // Fundo amarelo
        };

        // Aplica estilo aos cabeçalhos
        const range = XLSX.utils.decode_range(worksheet['!ref']!);
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
          worksheet[cellAddress].s = headerStyle;
        }

        // Cria o workbook e adiciona a planilha
        const workbook: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos');

        // Gera o arquivo Excel e baixa
        const excelBuffer: ArrayBuffer = XLSX.write(workbook, {
          bookType: 'xlsx',
          type: 'array',
          cellStyles: true, // Habilita estilos de células
        });
        const blob: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'produtos.xlsx';
        link.click();

        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Arquivo Excel exportado com formatação!',
        });
      }
    }
