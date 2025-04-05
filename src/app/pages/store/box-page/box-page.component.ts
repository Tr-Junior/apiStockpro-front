import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ImportsService } from '../../../../core/services/imports.service';
import { BoxItem} from '../../../../core/models/box-item.model';
import { BoxService } from '../../../../core/services/box.Service';
import { Product } from '../../../../core/models/product.model';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { MenuItem, MessageService } from 'primeng/api';
import { Budget } from '../../../../core/models/budget.model';
import { User } from '../../../../core/models/user.model';
import { Security } from '../../../../utils/Security.util';
import { PdfService } from '../../../../common/printPdf.service';
import { ProductService } from '../../../../core/api/products/product.service';
import { OrderService } from '../../../../core/api/order/order.service';
import { BudgetService } from '../../../../core/api/budget/budget.service';

@Component({
  selector: 'app-box-page',
  standalone: true,
  imports: [ImportsService.imports],
  providers: [ImportsService.providers],
  templateUrl: './box-page.component.html',
  styleUrl: './box-page.component.css'
})
export class BoxPageComponent implements OnInit, OnDestroy{
  public boxItems: BoxItem[] = [];
  public subtotal = 0;
  public grandTotal = 0;
  public products: Product[] = [];
  public currentPage = 1;
  public totalPages = 0;
  public searchQuery = '';
  public selectedPayment?: string;
  public generalDiscount = 0;
  public loading = false;
  public searchQueryChanged = new Subject<string>();
  public customerName = '';
  public filteredCustomers: string[] = [];
  public customerNames: string[] = [];
  public budgets: Budget[] = [];
  public items!: MenuItem[];
  public sidebarVisible = false;
  public selectedProduct: Product | null = null;
  public availableStock = 0;
  public user!: User;
  public editedPrice = 0;
  public total = null;
  public totalTroco = 0;
  public totalRecords = 0;
  public checked = false;
  public loadingBudget: boolean = false;
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();


  constructor(
    private boxService: BoxService,
    private productService: ProductService,
    private orderService: OrderService,
    private budgetService: BudgetService,
    private messageService: MessageService,
    private pdfService: PdfService

  ) {
  }


  ngOnInit(): void {
    this.user = Security.getUser();

    Promise.all([this.listBudget(), this.loadCustomerNames(), this.loadCart()]);

    this.boxService.items$.pipe(takeUntil(this.destroy$)).subscribe(items => {
      this.boxItems = items;
      this.calculateTotals();
    });

    // Adiciona debounce para evitar requisições excessivas
    this.searchSubject.pipe(
      debounceTime(200), // Aguarda 300ms sem digitação antes de pesquisar
      takeUntil(this.destroy$)
    ).subscribe(query => {
      const trimmedQuery = query.trim();

      if (!trimmedQuery.length) {
        this.clearSearch(); // Limpa os produtos quando o campo fica vazio
        return;
      }

      this.search(1, true);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getScrollHeight(): string {
    const itemHeight = 70;
    const totalItems = this.products.length;
    const maxHeight = 400;
    const minHeight = 200;

    let calculatedHeight = totalItems * itemHeight;
    if (calculatedHeight < minHeight) {
      calculatedHeight;
    } else if (calculatedHeight > maxHeight) {
      calculatedHeight = maxHeight;
    }
    return `${calculatedHeight}px`;
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }



  search(page: number = 1, reset: boolean = false): void {
    const trimmedQuery = this.searchQuery.trim();
    if (!trimmedQuery) {
        if (reset) this.clearSearch();
        return;
    }

    if (reset) {
        this.products = [];
        this.currentPage = 1;
    }

    this.fetchProducts(trimmedQuery, page, reset);
}

loadDataLazy(event: any): void {
    if (this.loading || this.currentPage >= this.totalPages) return;

    this.fetchProducts(this.searchQuery.trim(), this.currentPage + 1, false);
}

private fetchProducts(query: string, page: number, reset: boolean): void {
    this.loading = true;

    this.productService
        .searchProduct({ title: query, page, limit: 25 })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: ({ products, totalRecords }) => {
                this.products = reset ? products : [...this.products, ...products];
                this.totalRecords = totalRecords;
                this.totalPages = Math.ceil(totalRecords / 25);
                this.currentPage = page;
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro ao Buscar Produtos',
                    detail: `Houve um erro na busca. ${err.message || 'Tente novamente mais tarde.'}`
                });
                console.error('Erro de pesquisa', err);
            },
            complete: () => (this.loading = false),
        });
}


  clearSearch(): void {
    this.searchQuery = ''; // Limpa o campo de pesquisa
    this.products = []; // Zera a lista de produtos
    this.totalRecords = 0;
    this.currentPage = 1;
  }

  async loadCart() {
    this.boxItems = await this.boxService.getItems();
    this.calculateTotals();
  }

  async addToBox(data: any): Promise<void> {
    const product = this.products.find(p => p._id === data._id);
    if (!product) {
        return this.showMessage('error', 'Produto Não Encontrado', 'Produto não encontrado no estoque.');
    }

    // Obtém a quantidade reservada nos orçamentos e calcula o estoque disponível
    const { quantity: reservedQuantity, clients } = this.getQuantityInBudget(product._id);
    const availableStock = product.quantity - reservedQuantity;

    if (availableStock <= 0) {
        return this.showMessage('error', 'Estoque Indisponível', `Todo o estoque de ${product.title} já está reservado para clientes: ${clients.join(', ')}.`);
    }

    const existingItem = this.boxItems.find(item => item._id === product._id);
    if (existingItem) {
        if (existingItem.quantity + 1 > availableStock) {
            return this.showMessage('error', 'Quantidade Excedida', `Não é possível adicionar mais do que ${availableStock} unidades de ${product.title}.`);
        }
        existingItem.quantity += 1;
        this.boxService.updateItem(existingItem);
    } else {
        await this.boxService.addItem({
            _id: product._id,
            title: product.title,
            price: product.price,
            purchasePrice: product.purchasePrice,
            quantity: 1,
            discount: 0
        });
    }

    this.showMessage('success', 'Item Adicionado', `${product.title} foi adicionado ao carrinho.`);
    this.refreshCart();
}

private refreshCart(): void {
    this.boxItems = this.boxService.getItems();
    this.calcTroco();
}


updateQuantity(newQuantity: number, item: BoxItem, isFinalUpdate: boolean = false): void {
  if (newQuantity <= 0) {
      return this.showMessage('warn', 'Aviso', 'Quantidade zerada. Verifique os itens antes de continuar.');
  }

  this.productService.getProductById(item._id).subscribe({
      next: (product) => {
          if (!product) {
              return this.showMessage('error', 'Erro', 'Produto não encontrado no estoque');
          }

          const { quantity: reservedQuantity, clients } = this.getQuantityInBudget(product._id);
          const availableStock = product.quantity - reservedQuantity;

          if (availableStock <= 0) {
              return this.showMessage('error', 'Estoque Insuficiente',
                  `Todo o estoque de ${product.title} já está reservado para clientes: ${clients.join(', ')}.`);
          }

          item.quantity = Math.min(newQuantity, availableStock);
          if (newQuantity > availableStock) {
              this.showMessage('warn', 'Aviso', `Quantidade disponível em estoque considerando orçamentos: ${availableStock}`);
          }

          this.updateCartItem(item, isFinalUpdate);
      },
      error: (err) => {
          console.error('Erro ao buscar produto pelo ID:', err);
          this.showMessage('error', 'Erro', 'Não foi possível verificar o estoque do produto.');
      }
  });
}

private showMessage(severity: string, summary: string, detail: string): void {
  this.messageService.add({ severity, summary, detail });
}

private updateCartItem(item: BoxItem, isFinalUpdate: boolean): void {
  const updatedItems = this.boxService.getItems().map(i => i._id === item._id ? { ...i, quantity: item.quantity } : i);
  this.boxService['updateStorageSilent'](updatedItems);

  if (isFinalUpdate) {
      this.boxService.updateItem(item);
  }

  this.calculateTotals();
  this.calcTroco();
}



  async remove(data: any): Promise<void> {
    await this.boxService.removeItem(data._id);
    await this.loadCart();
  }


  calculateTotals(): void {
    this.subtotal = this.boxItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    this.grandTotal = this.subtotal * (1 - this.generalDiscount / 100);
    this.calcTroco();
  }

  calcTroco(): void {
    this.totalTroco = Math.max(0, (this.total || 0) - this.grandTotal);
  }

  updateGeneralDiscount(discount: number): void {
    this.generalDiscount = discount;
    this.calculateTotals(); // Recalcular o total com desconto
  }

  onFormPaymentSelected(payment: string): void {
    this.selectedPayment = payment;
    this.messageService.add({
      severity: 'info',
      summary: 'Forma de Pagamento Selecionada',
      detail: `Você selecionou: ${payment}`,
    });
  }

  public formPaymentOptions: { label: string, value: string, icon: string }[] = [
    { label: 'Crédito', value: 'Crédito', icon: 'pi pi-credit-card' },
    { label: 'Débito', value: 'Débito', icon: 'pi pi-wallet' },
    { label: 'Dinheiro', value: 'Dinheiro', icon: 'pi pi-money-bill' },
    { label: 'Pix', value: 'Pix', icon: 'pi pi-qrcode' }
  ];
  submitOrder(): void {
    if (!this.isOrderValid()) return;

    const order = this.createOrderObject(this.boxItems.filter(item => item.quantity > 0));
    this.loading = true;

    this.orderService.createOrder(order).subscribe({
        next: () => this.handleOrderSuccess(),
        error: (err) => this.handleOrderError(err),
        complete: () => (this.loading = false)
    });
}

private isOrderValid(): boolean {
    if (!this.boxItems.some(item => item.quantity > 0)) {
        this.showMessage('error', 'Erro', 'Adicione itens válidos ao caixa antes de finalizar a venda.');
        return false;
    }

    if (!this.selectedPayment) {
        this.showMessage('error', 'Erro', 'Selecione uma forma de pagamento antes de finalizar a venda.');
        return false;
    }

    return true;
}

private handleOrderSuccess(): void {
    this.showMessage('success', 'Venda Finalizada', 'Pedido realizado com sucesso!');
    this.clearBox();
    this.selectedPayment = undefined;
    this.clearSearch();
}

private handleOrderError(err: any): void {
    this.showMessage('error', 'Erro', `Falha ao finalizar a venda: ${err.message || 'Erro desconhecido.'}`);
}




private createOrderObject(validItems: any[]): any {
    return {
        customer: this.user._id,
        sale: {
            items: validItems.map(item => ({
                quantity: item.quantity,
                price: item.price,
                discount: item.discount || 0,
                title: item.title,
                product: item._id
            })),
            formPayment: this.selectedPayment,
            discount: this.generalDiscount,
            total: this.grandTotal
        }
    };
}


listBudget() {
  this.budgetService.getBudget().subscribe({
   next: (data: Budget[]) => {
      this.budgets = data;
    },
    error: (error) => console.error(error)
  });
}

filterCustomer(event: any) {
  const query = event.query.toLowerCase();
  this.filteredCustomers = this.customerNames.filter(customer => customer.toLowerCase().includes(query));
}

loadCustomerNames() {
  this.budgetService.getBudget().subscribe({
    next: (data: Budget[]) => {
      this.customerNames = data.map(budget => budget.client);
    },
    error: (err: any) => {
      console.log(err);
      //this.toastr.error(err.message);
    }
  });
}


async createBudget() {
  this.loadingBudget = true;

  try {
    const cartItems = await this.boxService.getItems(); // Recupera os itens do caixa

    if (cartItems.length === 0) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'O carrinho está vazio' });
      return;
    }

    if (!this.customerName || this.customerName.trim() === '') {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Nome do cliente não pode estar vazio' });
      return;
    }

    const budget = {
      client: this.customerName,
      budget: {
        items: cartItems.map(item => ({
          quantity: item.quantity,
          price: item.price,
          title: item.title,
          product: item._id
        })),
        total: cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
      }
    };

    // Envia o orçamento ao backend
    const data: any = await this.budgetService.createBudget(budget).toPromise();
    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: data.message });

    this.clearBox();
    this.customerName = '';
    this.grandTotal = 0;
    this.subtotal = 0;
    this.totalTroco = 0;
    this.listBudget();
    this.loadCustomerNames();
    this.loadingBudget = false;

  } catch (err: any) {
    console.error(err);
    this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.message });
  }
}

async clearBox() {
  await this.boxService.clearBox();
    await this.loadCart();
    this.grandTotal = 0;
    this.subtotal = 0;
    this.totalTroco = 0;
    this.total = null;
    this.generalDiscount = 0;
}


getQuantityInBudget(productId: string): { quantity: number, clients: string[] } {
  let quantity = 0;
  let clients: Set<string> = new Set();  // Usando Set para evitar duplicatas

  this.budgets.forEach(budget => {
    budget.budget.items.forEach(item => {
      if (item.product === productId) {
        quantity += item.quantity;
        clients.add(budget.client);  // Adiciona o nome do cliente ao Set
      }
    });
  });

  // Retorna a quantidade total do produto nos orçamentos e os nomes dos clientes únicos
  return { quantity, clients: Array.from(clients) };
}


openSidebar(product: Product): void {
  this.selectedProduct = product;

  const boxItem = this.boxItems.find(item => item._id === product._id);
  this.editedPrice = boxItem ? boxItem.price : product.price; // Valor inicial
  this.sidebarVisible = true;

  // Obter a quantidade real em estoque diretamente do banco
  this.productService.getProductById(product._id).subscribe({
      next: (productFromDb) => {
          if (!productFromDb) {
              this.messageService.add({
                  severity: 'error',
                  summary: 'Erro',
                  detail: 'Produto não encontrado no estoque'
              });
              return;
          }

          // Calcula a quantidade disponível sem alterar selectedProduct
          const availableStock = this.calculateRealStock(productFromDb);

          // Exibe a quantidade disponível em estoque na barra lateral sem sobrescrever o valor do produto
          this.messageService.add({
              severity: 'info',
              summary: 'Estoque disponível',
              detail: `Quantidade disponível em estoque: ${availableStock}`
          });

          // Armazenar a quantidade de estoque em uma variável separada, sem sobrescrever a quantidade do produto
          this.availableStock = availableStock;
      },
      error: (err) => {
          console.error('Erro ao buscar produto pelo ID:', err);
          this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: 'Não foi possível verificar o estoque do produto.'
          });
      }
  });
}

calculateRealStock(product: Product): number {
  // Retorna a quantidade total do produto sem considerar o carrinho
  return product.quantity;
}


saveEditedPrice(): void {
  if (this.selectedProduct && this.editedPrice !== null) {
    const boxItem = this.boxItems.find(item => item._id === this.selectedProduct!._id);

    if (boxItem) {
      boxItem.price = this.editedPrice; // Atualiza o preço no array boxItems

      // Atualiza o sessionStorage
      sessionStorage.setItem('Box_Items', JSON.stringify(this.boxItems));

      this.calculateTotals(); // Recalcula os totais
      this.messageService.add({
        severity: 'success',
        summary: 'Preço Atualizado',
        detail: `O preço do produto "${this.selectedProduct.title}" foi atualizado para ${this.editedPrice}.`
      });
    }
    this.closeSidebar();
  }
}


closeSidebar(): void {
  this.sidebarVisible = false;
  this.selectedProduct = null;
  this.editedPrice = 0;
}


saveBoxAsPdf(): void {
  if (this.boxItems.length === 0) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Atenção',
      detail: 'Nenhum item no caixa para salvar como PDF.',
    });
    return;
  }

  this.pdfService.saveBoxItemsAsPdf(this.boxItems, this.subtotal, this.grandTotal, this.generalDiscount);
  this.messageService.add({
    severity: 'success',
    summary: 'PDF Gerado',
    detail: 'O resumo do caixa foi salvo como PDF.',
  });
}

async printReceipt() {
  if (this.boxItems.length === 0) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Atenção',
      detail: 'Nenhum item no caixa para imprimir como cupom.',
    });
    return;
  }

  try {
    // Chama o serviço para gerar e imprimir o cupom
    this.pdfService.printReceipt(
      this.boxItems,               // Itens do caixa
      this.subtotal,               // Subtotal
      this.grandTotal,             // Total com desconto
      this.generalDiscount,        // Desconto geral
      this.selectedPayment || 'Não especificado' // Método de pagamento
    );

    this.messageService.add({
      severity: 'success',
      summary: 'Cupom Gerado',
      detail: 'O cupom foi gerado com sucesso.',
    });
  } catch (error) {
    this.messageService.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Ocorreu um erro ao gerar o cupom fiscal.',
    });
    console.error('Erro ao gerar cupom:', error);
  }
}


}
