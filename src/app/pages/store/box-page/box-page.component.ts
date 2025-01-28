import { Component } from '@angular/core';
import { ImportsService } from '../../../../../core/services/imports.service';
import { BoxItem} from '../../../../../core/models/box-item.model';
import { BoxService } from '../../../../../core/services/box.Service';
import { DataService } from '../../../../../core/services/data.service';
import { Product } from '../../../../../core/models/product.model';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { MenuItem, MessageService } from 'primeng/api';
import { Budget } from '../../../../../core/models/budget.model';
import { User } from '../../../../../core/models/user.model';
import { Security } from '../../../../utils/Security.util';
import { PdfService } from '../../../../common/printPdf.service';

@Component({
  selector: 'app-box-page',
  standalone: true,
  imports: [ImportsService.imports],
  providers: [ImportsService.providers, DataService],
  templateUrl: './box-page.component.html',
  styleUrl: './box-page.component.css'
})
export class BoxPageComponent {
  public boxItems: BoxItem[] = [];
  public subtotal: number = 0;
  public grandTotal: number = 0;
  public products: Product[] = [];
  public currentPage: number = 1; // Inicialize com 1 ou conforme a lógica do seu componente
  public totalPages: number = 0;
  public searchQuery: string = '';
  public selectedPayment?: string;
  public generalDiscount: number = 0; // Desconto aplicado
  public loading = false;
  public searchQueryChanged = new Subject<string>();
  public customerName: string = '';  // Adicionado
  public filteredCustomers: string[] = [];
  public customerNames: string[] = [];
  public budgets: Budget[] = [];
  public items!: MenuItem[];
  public sidebarVisible: boolean = false; // Controle de visibilidade da barra lateral
  public selectedProduct: Product | null = null; // Produto selecionado
  public availableStock: number = 0;
  public user!: User;
  public editedPrice: number | null = null; // Valor editado do item
  public total: number = 0; // Valor recebido
  public totalTroco: number = 0; // Valor do troco

  constructor(
    private boxService: BoxService,
    private service: DataService,
    private messageService: MessageService,
    private pdfService: PdfService

  ) {
  }

  checked: boolean = false;
  async ngOnInit() {
    this.user = Security.getUser();
    this.boxService.items$.subscribe(items => {
      this.boxItems = items;
    });

    await this.loadCart();
    this.searchQueryChanged.pipe(
      debounceTime(300), // Aguarda 300ms após o último evento
      distinctUntilChanged() // Ignora valores iguais consecutivos
    ).subscribe(query => {
      this.searchQuery = query;
      this.search();
    });
    this.loadCustomerNames();
  }

  search(page: number = 1): void {
    const trimmedQuery = (this.searchQuery || '').trim();
    if (!trimmedQuery) {
        this.products = [];
        this.totalPages = 0;
        this.currentPage = 1;
        return;
    }

    this.loading = true; // Ativa o loader
    const searchData = { title: trimmedQuery, page };

    this.service.searchProduct(searchData).subscribe({
        next: (response: any) => {
            this.products = response.products;
            this.totalPages = response.totalPages;
            this.currentPage = response.page;
            this.loading = false;

            if (response.products.length === 0) {
                this.messageService.add({
                    severity: 'info',
                    summary: 'Nenhum Produto Encontrado',
                    detail: 'Sua busca não retornou resultados.'
                });
            }
        },
        error: (err: any) => {
            this.loading = false;
            this.messageService.add({
                severity: 'error',
                summary: 'Erro ao Buscar Produtos',
                detail: 'Houve um erro ao tentar buscar os produtos. ' + (err.message || 'Tente novamente mais tarde.')
            });
        }
    });
}


  clearSearch(): void {
    this.searchQuery = '';
    this.products = [];
  }

  onPageChange(page: number): void {
    this.search(page);
  }

  async loadCart() {
    this.boxItems = await this.boxService.getItems();
    this.calculateTotals();
  }

  async addToBox(data: any): Promise<void> {
    const product = this.products.find(p => p._id === data._id);

    if (!product) {
      this.messageService.add({
        severity: 'error',
        summary: 'Produto Não Encontrado',
        detail: 'Produto não encontrado no estoque.'
      });
      return;
    }

    const existingItem = this.boxItems.find(item => item._id === product._id);

    if (existingItem && existingItem.quantity >= product.quantity) {
      this.messageService.add({
        severity: 'error',
        summary: 'Quantidade Excedida',
        detail: `Não é possível adicionar mais do que ${product.quantity} unidades de ${product.title}.`
      });
      return;
    }

    const newItem: BoxItem = existingItem
      ? { ...existingItem, quantity: existingItem.quantity + 1 }
      : { _id: product._id, title: product.title, price: product.price, purchasePrice: product.purchasePrice,  quantity: 1, discount: 0  };

    await this.boxService.addItem(newItem);

    this.messageService.add({
      severity: 'success',
      summary: 'Item Adicionado',
      detail: `${product.title} foi adicionado ao carrinho.`
    });

    await this.loadCart();
  }

  updateQuantity(newQuantity: number, item: BoxItem): void {
    if (newQuantity <= 0) {
        this.messageService.add({
            severity: 'warn',
            summary: 'Aviso',
            detail: 'Quantidade zerada. verifique os itens antes de continuar.'
        });
        return;
    }

    this.service.getProductById(item._id).subscribe({
        next: (product) => {
            if (!product) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Produto não encontrado no estoque'
                });
                return;
            }

            const availableQuantity = product.quantity;

            if (newQuantity > availableQuantity) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Aviso',
                    detail: `Quantidade disponível em estoque: ${availableQuantity}`
                });
                item.quantity = availableQuantity; // Ajusta para a quantidade máxima disponível
            } else {
                item.quantity = newQuantity; // Atualiza para o valor inserido
            }

            this.calculateTotals();
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

  async remove(data: any): Promise<void> {
    await this.boxService.removeItem(data._id);
    await this.loadCart();
  }

  async clearCart(): Promise<void> {
    await this.boxService.clearBox();
    await this.loadCart();
  }

  calculateTotals(): void {
    this.subtotal = this.boxItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountValue = this.subtotal * (this.generalDiscount / 100);
    this.grandTotal = this.subtotal - discountValue;
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
    const validItems = this.boxItems.filter(item => item.quantity > 0);

    if (validItems.length === 0) {
        this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Adicione itens válidos ao caixa antes de finalizar a venda.'
        });
        return;
    }

    if (!this.selectedPayment) {
        this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Selecione uma forma de pagamento antes de finalizar a venda.'
        });
        return;
    }

    const order = this.createOrderObject(validItems);

    this.loading = true; // Ativa o loading

    // Simula um atraso de 2 segundos (2000 ms) antes de finalizar a venda
    setTimeout(() => {
        this.service.createOrder(order).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Venda Finalizada',
                    detail: 'Pedido realizado com sucesso!'
                });
                this.clearCart();
                this.selectedPayment = undefined;
            },
            error: err => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Falha ao finalizar a venda: ' + (err.message || 'Erro desconhecido.')
                });
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao finalizar a venda.' });
      console.error('Erro ao criar venda:', err);
      console.error('Erro ao criar venda:', validItems);

            }
        });

        this.loading = false; // Desativa o loading após a execução
    }, 1000); // Atraso de 2 segundos
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



calcTroco() {
  // Certifique-se de tratar NaN para evitar problemas ao calcular
  const totalParsed = this.total || 0;
  const grandTotalParsed = this.grandTotal || 0;
  this.totalTroco = totalParsed - grandTotalParsed;

  // Caso o valor recebido seja menor que o total, o troco é 0
  if (this.totalTroco < 0) {
    this.totalTroco = 0;
  }
}

filterCustomer(event: any) {
  const query = event.query.toLowerCase();
  this.filteredCustomers = this.customerNames.filter(customer => customer.toLowerCase().includes(query));
}

loadCustomerNames() {
  this.service.getBudget().subscribe({
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
    const data: any = await this.service.createBudget(budget).toPromise();
    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: data.message });

    // Limpa o armazenamento local
    await this.boxService.clearBox();
    this.customerName = ''; // Limpa o nome do cliente
    this.grandTotal = 0;
    //await this.listBudget();
    await this.loadCustomerNames();
  } catch (err: any) {
    console.error(err);
    this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.message });
  }
}

async clearBox() {
  await this.boxService.clearBox();
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
  this.service.getProductById(product._id).subscribe({
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
      boxItem.price = this.editedPrice; // Atualiza o preço apenas para esta venda
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
  this.editedPrice = null;
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
      this.customerName || '',     // Nome do cliente (ou vazio, caso não informado)
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
