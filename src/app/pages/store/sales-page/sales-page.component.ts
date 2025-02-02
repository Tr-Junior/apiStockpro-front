import { Component } from '@angular/core';
import { Order } from '../../../../../core/models/order.models';
import { ImportsService } from '../../../../../core/api/imports.service';
import { DataService } from '../../../../../core/api/data.service';
import { Router } from '@angular/router';
import { PrimeNGConfig, MessageService, ConfirmationService } from 'primeng/api';
import { Security } from '../../../../utils/Security.util';

@Component({
  selector: 'app-sales-page',
  standalone: true,
  imports: [ImportsService.imports],
  providers: [ImportsService.providers, DataService, MessageService], // Adicionado MessageService
  templateUrl: './sales-page.component.html',
  styleUrls: ['./sales-page.component.css']
})
export class SalesPageComponent {
  public paymentTotals: PaymentTotal[] = [];
  public orders: Order[] = [];
  public busy = false;
  public rangeDates?: Date[];
  public ptBR: any;

  constructor(
    private primengConfig: PrimeNGConfig,
    private service: DataService,
    private router: Router,
    private messageService: MessageService, // Injetado MessageService
    private confirmationService: ConfirmationService

  ) {}

  ngOnInit() {
    Security.clearPass();
    this.listOrders();
    this.primengConfig.setTranslation(this.ptBR);
  }

  listOrders() {
    this.busy = true; // Indica que o carregamento está em andamento
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (this.rangeDates) {
      if (this.rangeDates.length === 2) {
        // Se `rangeDates` contém duas datas, considera um intervalo
        startDate = this.rangeDates[0];
        endDate = this.rangeDates[1];
      } else if (this.rangeDates.length === 1) {
        // Se `rangeDates` contém apenas uma data, considera apenas o início
        startDate = this.rangeDates[0];
      }
    }

    this.service.getOrderByDateRange(startDate, endDate).subscribe({
      next: (data: any) => {
        this.orders = data;
        this.calculatePaymentTotals();
        this.busy = false; // Indica que o carregamento foi concluído
      },
      error: (err: any) => {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: err.message || 'Erro ao carregar pedidos.'
        });
        this.busy = false; // Indica que o carregamento foi concluído
      }
    });
  }



  clearSearch(): void {
    this.rangeDates = [];
    this.orders = [];
    this.listOrders();
  }

  calculatePaymentTotals() {
    const paymentTotalsMap = new Map<string, number>();
    let totalSales = 0;

    const paymentClasses: { [key: string]: string } = {
      'Total': 'payment-total',
      'Crédito': 'payment-credit',
      'Dinheiro': 'payment-cash',
      'Pix': 'payment-pix',
      'Débito': 'payment-debit'
    };

    this.orders.forEach(order => {
      const paymentMethod = order.sale.formPayment;
      const total = order.sale.total;

      console.log('Forma de pagamento:', paymentMethod); // Adicionado para verificar valores

      totalSales += total;

      if (paymentTotalsMap.has(paymentMethod)) {
        paymentTotalsMap.set(paymentMethod, paymentTotalsMap.get(paymentMethod)! + total);
      } else {
        paymentTotalsMap.set(paymentMethod, total);
      }
    });

    this.paymentTotals = [{
      paymentMethod: 'Total',
      total: totalSales,
      className: paymentClasses['Total']
    }];

    Array.from(paymentTotalsMap).forEach(([paymentMethod, total]) => {
      this.paymentTotals.push({
        paymentMethod,
        total,
        className: paymentClasses[paymentMethod] || 'payment-others'
      });
    });
  }
  confirmDelete(order: any) {
    this.confirmationService.confirm({
      message: `Deseja realmente excluir a Venda: ${order.number}?`,
      header: 'Confirmação',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.delete(order._id, order.number); // Chama o método delete se o usuário aceitar
      },
      reject: () => {
        // Ação de rejeição pode ser deixada vazia, ou você pode adicionar uma lógica
      }
    });
  }

  async delete(id: any, code: any) {
    try {
      const data = await this.service.delOrder(id).toPromise();
      this.messageService.add({
        severity: 'success',
        summary: 'Venda deletada',
        detail: data.message // Mostra a mensagem de sucesso para a venda deletada
      });

      await this.service.delEntrancesByCode(code).toPromise();
      this.messageService.add({
        severity: 'success',
        summary: 'Entrada deletada',
        detail: 'Entrada deletada com sucesso' // Mensagem de sucesso para a entrada deletada
      });

      this.listOrders(); // Atualiza a lista de pedidos após exclusão

    } catch (err: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro ao deletar venda',
        detail: err.message // Mensagem de erro caso algo dê errado
      });
    }
  }
}

export interface PaymentTotal {
  paymentMethod: string;
  total: number;
  color?: any;
  className: string;
}
