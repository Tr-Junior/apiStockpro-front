import { Component } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BoxItem } from '../../models/box-item.model';
import { Budget } from '../../models/budget.model';
import { DataService } from '../../services/data.service';
import { Image } from '../../models/image.model';
@Component({
  selector: 'app-print-pdf',
  standalone: true,
  imports: [],
  templateUrl: './print-pdf.component.html',
  styleUrl: './print-pdf.component.css'
})
export class PrintPdfComponent {
  private logo: string = '';
  private nome: string = '';
  private endereco: string = '';
  private cidade: string = '';
  private telefone: string = '';
  private cnpj: string = '';

  constructor(private dataService: DataService) {
    this.loadCompanyData();
  }

  private loadCompanyData(): void {
    this.dataService.getCompany().subscribe((companies) => {
      if (companies && companies.length > 0) {
        const company = companies[0];
        this.nome = company.name;
        this.endereco = company.address.addressLine;
        this.cidade = company.address.city;
        this.telefone = company.contact.telephone;
        this.cnpj = company.cnpj;
      }
    });

    this.dataService.getImages('logo').subscribe((image: Image) => {
      if (image && image.imageUrl) {
        this.logo = image.imageUrl;
      }
    });
  }

  private addHeader(doc: jsPDF): void {
    const logoWidth = 140;
    const logoX = (doc.internal.pageSize.getWidth() - logoWidth) / 2;
    doc.addImage(this.logo, 'PNG', logoX, 5, logoWidth, 35);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const infoX = 10;
    doc.text(`Nome: ${this.nome}`, infoX, 45);
    doc.text(`Endereço: ${this.endereco}`, infoX, 50);
    doc.text(`Cidade: ${this.cidade}`, infoX, 55);
    doc.text(`Telefone: ${this.telefone}`, infoX, 60);
    doc.text(`CNPJ: ${this.cnpj}`, infoX, 65);

    const currentDate = new Date();
    const formattedDate = `${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}`;
    doc.text(`Data e Hora: ${formattedDate}`, infoX, 70);

    const lineY = 75;
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.line(10, lineY, doc.internal.pageSize.getWidth() - 10, lineY);
  }

  private addFooter(doc: jsPDF): void {
    doc.setFontSize(10);
    doc.text('Agradecemos a preferência!', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 20, {
      align: 'center',
    });
  }

  saveBoxItemsAsPdf(items: BoxItem[], subtotal: number, grandTotal: number, generalDiscount: number): void {
    const doc = new jsPDF();
    this.addHeader(doc);

    // Tabela de itens do caixa
    const headers = [['Produto', 'Quantidade', 'Valor Unitário', 'Valor Total']];
    const tableData = items.map((item) => [
      item.title,
      item.quantity,
      `R$ ${item.price.toFixed(2)}`,
      `R$ ${(item.price * item.quantity).toFixed(2)}`,
    ]);
    tableData.push(['-', '-', 'Total:', `R$ ${grandTotal.toFixed(2)}`]);

    autoTable(doc, {
      startY: 80,
      head: headers,
      body: tableData,
      styles: { fontSize: 10 },
    });

    this.addFooter(doc);
    doc.save('resumo-caixa.pdf');
  }

  saveBudgetAsPdf(budget: Budget): void {
    const doc = new jsPDF();
    this.addHeader(doc);

    // Informações do orçamento
    doc.setFontSize(12);
    doc.text(`Cliente: ${budget.client}`, 10, 69);

    // Tabela de itens do orçamento
    const headers = [['Produto', 'Quantidade', 'Valor Unitário', 'Valor Total']];
    const tableData = budget.budget.items.map((item) => [
      item.title,
      item.quantity,
      `R$ ${item.price.toFixed(2)}`,
      `R$ ${(item.price * item.quantity).toFixed(2)}`,
    ]);
    tableData.push(['-', '-', 'Total:', `R$ ${budget.budget.total.toFixed(2)}`]);

    autoTable(doc, {
      startY: 80,
      head: headers,
      body: tableData,
      styles: { fontSize: 10 },
    });

    this.addFooter(doc);

    // Sanitiza o nome do cliente para ser usado como nome de arquivo
    const sanitizedClientName = budget.client
      .replace(/[\/\\:*?"<>|]/g, '') // Remove caracteres inválidos para nomes de arquivo
      .trim(); // Remove espaços extras

    const fileName = sanitizedClientName ? `orcamento_${sanitizedClientName}.pdf` : 'orcamento.pdf';
    doc.save(fileName);
  }
  printReceipt(
    boxItems: BoxItem[],
    subtotal: number,
    grandTotal: number,
    generalDiscount: number,
    customerName: string,
    paymentMethod: string
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 297], // Formato típico de recibos
    });

    // Adiciona o cabeçalho diretamente
    const logoWidth = 65; // Ajuste do tamanho da logo
const logoX = (doc.internal.pageSize.getWidth() - logoWidth) / 2;
doc.addImage(this.logo, 'PNG', logoX, 5, logoWidth, 15);

doc.setFont('helvetica', 'normal');

// Personalização dos tamanhos das fontes
doc.setFontSize(10);
doc.text(this.nome, doc.internal.pageSize.getWidth() / 2, 25, { align: 'center' });

doc.setFontSize(8);
doc.text(`Endereço: ${this.endereco}`, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
doc.text(`Cidade: ${this.cidade}`, doc.internal.pageSize.getWidth() / 2, 35, { align: 'center' });
doc.text(`Telefone: ${this.telefone}`, doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' });
doc.text(`CNPJ: ${this.cnpj}`, doc.internal.pageSize.getWidth() / 2, 45, { align: 'center' });


    // Adiciona uma linha separadora
    doc.setLineWidth(0.5);
    doc.line(1, 48, doc.internal.pageSize.getWidth() - 1, 48);

    // Cabeçalhos da tabela
    const headers = [['Cod', 'Descrição', 'Qtd', 'Vlr Unit', 'Vlr Total']];

    // Itens da tabela
    const items = boxItems.map((item, index) => [
      (index + 1).toString(),
      item.title,
      item.quantity.toFixed(0).replace('.', ','),
      item.price.toFixed(2).replace('.', ','),
      (item.price * item.quantity).toFixed(2).replace('.', ','),
    ]);

    let yPosition = 50; // A posição Y inicial após o cabeçalho

    // Renderiza a tabela
    (doc as any).autoTable({
      startY: yPosition,
      head: headers,
      body: items,
      margin: { left: 0, right: 0 },
      styles: {
        fontSize: 9,
        cellPadding: 1,
        overflow: 'linebreak',
        halign: 'center',
      },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 30 },
        2: { cellWidth: 10 },
        3: { cellWidth: 15 },
        4: { cellWidth: 15 },
      },
    });

    // Adiciona informações de totais
    const finalY = (doc as any).autoTable.previous.finalY;
    doc.setFontSize(8);
    doc.text(`QTD. TOTAL DE ITENS: ${boxItems.length}`, 5, finalY + 10);
    doc.text(`VALOR TOTAL: R$ ${subtotal.toFixed(2).replace('.', ',')}`, 5, finalY + 15);
    if (generalDiscount > 0) {
      doc.text(`DESCONTO: R$ ${(subtotal * (generalDiscount / 100)).toFixed(2).replace('.', ',')}`, 5, finalY + 20);
    }
    doc.text(`TOTAL A PAGAR: R$ ${grandTotal.toFixed(2).replace('.', ',')}`, 5, finalY + 25);
    doc.text(`FORMA DE PAGAMENTO: ${paymentMethod}`, 5, finalY + 30);

    // Adiciona o rodapé
    doc.setFontSize(8);
    doc.text('Agradecemos a preferência!', 5, finalY + 40, { align: 'left' });

    // Abre a caixa de diálogo de impressão
    const pdfOutput = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfOutput);
    const printWindow = window.open(blobUrl);
    printWindow!.onload = function () {
      printWindow!.focus();
      printWindow!.print();
    };
  }

}