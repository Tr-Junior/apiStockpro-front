import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { BoxItem } from '../core/models/box-item.model';
import { Budget } from '../core/models/budget.model';
import autoTable from 'jspdf-autotable';
import { ICompany } from '../core/models/company.model';
import { Order } from '../core/models/order.models';

@Injectable({
  providedIn: 'root',
})
export class PdfService {

  public logo: string = '';
  public nome: string = '';
  public endereco: string = '';
  public cidade: string = '';
  public telefone: string = '';
  public cnpj: string = '';
  constructor(

  ) {

    const company = this.getCompanyFromStorage();
    if (company) {
      this.nome = company.name;
      this.endereco = `${company.address.backYard},${company.address.neighborhood},${company.address.addressLine} `;
      this.cidade = `${company.address.city} - ${company.address.state}`;
      this.telefone = company.contact.telephone;
      this.cnpj = company.cnpj;
    }

    const logoUrl = this.getCompanyPdfFromStorage();
    if (logoUrl) {
      this.logo = logoUrl;
    }
    }
    getCompanyFromStorage(): ICompany | null {
      const companyData = localStorage.getItem('companyData');
      return companyData ? JSON.parse(companyData) : null;
    }

    getCompanyLogoFromStorage(): string | null {
      return localStorage.getItem('companyLogo');
    }

    getCompanyPdfFromStorage(): string | null {
      return localStorage.getItem('companyPdf');
    }

    private addHeader(doc: jsPDF): void {
      // Adiciona a logo centralizada
      const logoWidth = 140; // Largura da logo
      const logoX = (doc.internal.pageSize.getWidth() - logoWidth) / 2; // Posição X centralizada
      doc.addImage(this.logo, 'PNG', logoX, 5, logoWidth, 35);

      // Informações de empresa
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const infoX = 10; // Posição X inicial das informações
      doc.text(`Nome: ${this.nome}`, infoX, 50);
      doc.text(`CNPJ: ${this.cnpj} `, infoX, 55);
      doc.text(`Endereço: ${this.endereco}`, infoX, 60);

      // Telefone e CNPJ na mesma linha
      const telefoneCnpjText = `Cidade: ${this.cidade}  |  Telefone: ${this.telefone}`;
      doc.text(telefoneCnpjText, infoX, 65);

      // Linha de separação estilizada
      const lineY = 70; // Posição Y da linha
      doc.setLineWidth(0.5);
      doc.setDrawColor(0, 0, 0); // Cor preta
      doc.line(10, lineY, doc.internal.pageSize.getWidth() - 10, lineY); // Linha de margem a margem
  }

  private addFooter(doc: jsPDF): void {
      doc.setFontSize(10);

      // Data e Hora no final da página
      const currentDate = new Date();
      const formattedDate = `${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}`;
      doc.text(`Data e Hora: ${formattedDate}`, 10, doc.internal.pageSize.getHeight() - 15);

      // Mensagem centralizada no rodapé
      doc.text('Agradecemos a preferência!', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, {
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
      startY: 75,
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

    doc.setFontSize(12);

    const headers = [['Produto', 'Quantidade', 'Valor Unitário', 'Valor Total']];
    let total = 0; // Inicializa o total

    const tableData = budget.budget.items.map((item) => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal; // Soma ao total recalculado
      return [
        item.title,
        item.quantity,
        `R$ ${item.price.toFixed(2)}`,
        `R$ ${itemTotal.toFixed(2)}`
      ];
    });

    tableData.push(['-', '-', 'Total:', `R$ ${total.toFixed(2)}`]);

    autoTable(doc, {
      startY: 80,
      head: headers,
      body: tableData,
      styles: { fontSize: 10 },
    });

    this.addFooter(doc);

    const sanitizedClientName = budget.client.replace(/[\/\\:*?"<>|]/g, '').trim();
    const fileName = sanitizedClientName ? `orcamento_${sanitizedClientName}.pdf` : 'orcamento.pdf';
    doc.save(fileName);
  }



  printReceipt(
    boxItems: BoxItem[],
    subtotal: number,
    grandTotal: number,
    generalDiscount: number,
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
doc.setFontSize(11);
doc.text(this.nome, doc.internal.pageSize.getWidth() / 2, 25, { align: 'center' });

doc.setFontSize(10);
// Configurar o texto para quebra de linha
const maxWidth = doc.internal.pageSize.getWidth(); // Largura máxima para o texto
const enderecoQuebrado = doc.splitTextToSize(`Endereço: ${this.endereco}`, maxWidth);

// Definir as coordenadas para as linhas
doc.text(enderecoQuebrado, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
doc.text(`Cidade: ${this.cidade}`, doc.internal.pageSize.getWidth() / 2, 38, { align: 'center' });
doc.text(`Telefone: ${this.telefone}`, doc.internal.pageSize.getWidth() / 2, 42, { align: 'center' });
doc.text(`CNPJ: ${this.cnpj}`, doc.internal.pageSize.getWidth() / 2, 46, { align: 'center' });



    // Adiciona uma linha separadora
    doc.setLineWidth(0.5);
    doc.line(1, 48, doc.internal.pageSize.getWidth() - 1, 49);

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
const pageWidth = (doc as any).internal.pageSize.width;
const marginRight = 2; // Margem da direita

doc.setFontSize(8);

const valueAlignX = pageWidth - marginRight; // Posição X dos valores

doc.text(`QTD. TOTAL DE ITENS:`, 5, finalY + 10);
doc.text(`${boxItems.length}`, valueAlignX, finalY + 10, { align: 'right' });

doc.text(`VALOR TOTAL:`, 5, finalY + 15);
doc.text(`R$ ${subtotal.toFixed(2).replace('.', ',')}`, valueAlignX, finalY + 15, { align: 'right' });

if (generalDiscount > 0) {
  doc.text(`DESCONTO:`, 5, finalY + 20);
  doc.text(`R$ ${(subtotal * (generalDiscount / 100)).toFixed(2).replace('.', ',')}`, valueAlignX, finalY + 20, { align: 'right' });
}

doc.text(`TOTAL A PAGAR:`, 5, finalY + 25);
doc.text(`R$ ${grandTotal.toFixed(2).replace('.', ',')}`, valueAlignX, finalY + 25, { align: 'right' });

doc.text(`FORMA DE PAGAMENTO:`, 5, finalY + 30);
doc.text(`${paymentMethod}`, valueAlignX, finalY + 30, { align: 'right' });

// Adiciona o rodapé alinhado ao centro
doc.setFontSize(8);
doc.text('Agradecemos a preferência!', pageWidth / 2, finalY + 40, { align: 'center' });


    // Abre a caixa de diálogo de impressão
    const pdfOutput = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfOutput);
    const printWindow = window.open(blobUrl);
    printWindow!.onload = function () {
      printWindow!.focus();
      printWindow!.print();
    };
  }

  printSale(order: Order): void {
    const doc = new jsPDF();
    this.addHeader(doc);

    // Cabeçalhos da tabela
    const headers = [['Produto', 'Qtd', 'Valor Unitário', 'Total']];
    const tableData: (string | { content: string, colSpan?: number, styles?: any })[][] = order.sale.items.map(item => [
      item.title,
      item.quantity.toString(),
      `R$ ${item.price.toFixed(2)}`,
      `R$ ${(item.quantity * item.price).toFixed(2)}`
    ]);

    // Adiciona uma linha separadora
    tableData.push([
      { content: '', colSpan: 4, styles: { fillColor: [200, 200, 200] } }
    ]);

    // Adiciona os dados da venda alinhados corretamente
    tableData.push([
      { content: `Venda Nº: ${order.number}`, colSpan: 2, styles: { halign: 'left', fontStyle: 'bold' } },
      { content: `Forma de Pagamento: ${order.sale.formPayment}`, colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } }
    ]);

    tableData.push([
      { content: `Total: R$ ${order.sale.total.toFixed(2)}`, colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } }
    ]);

    // Gera a tabela
    autoTable(doc, {
      startY: 80,
      head: headers,
      body: tableData,
      styles: { fontSize: 10 },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });

    this.addFooter(doc);

    doc.save(`venda_${order.number}.pdf`);
}

}
