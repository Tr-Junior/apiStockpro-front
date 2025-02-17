import { Injectable } from '@angular/core';
import { CompanyService } from '../api/company/company.service';
import { ICompany } from '../models/company.model';
import { UploadService } from '../api/upload/upload.service';
import { MessageService } from 'primeng/api';
import { Image } from '../models/image.model';

@Injectable({
  providedIn: 'root'
})
export class CompanyDataService {
  public company: ICompany[] = [];
  public logoImage: { filePath: string } | null = null;
  public pdfImage: { filePath: string } | null = null;

  constructor(
    private companyService: CompanyService,
    private uploadService: UploadService,
    private messageService: MessageService
  ) {}

  /**
   * Carrega os dados da empresa e imagens antes do Angular inicializar
   */
  async loadInitialData(): Promise<void> {
    try {
      await this.listCompany();
      await this.getImages();
      console.log('Dados da empresa carregados com sucesso.');
    } catch (error) {
      console.error('Erro ao carregar os dados da empresa:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao carregar os dados iniciais'
      });
    }
  }

  /**
   * Busca os dados da empresa e salva no localStorage
   */
  private async listCompany(): Promise<void> {
    const savedData = localStorage.getItem('companyData');
    if (savedData) {
      this.company = [JSON.parse(savedData)];
      return;
    }

    try {
      const data = await this.companyService.getCompany().toPromise();
      if (data && data.length > 0) {
        this.company = data;
        localStorage.setItem('companyData', JSON.stringify(data[0]));
      }
    } catch (error) {
      console.error('Erro ao buscar empresa:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao carregar os dados da empresa'
      });
      throw error;
    }
  }

  /**
   * Busca a logo e o PDF da empresa e salva no localStorage
   */
  private async getImages(): Promise<void> {
    try {
      if (!localStorage.getItem('companyLogo')) {
        const logoData = await this.uploadService.getImages('logo').toPromise();
        if (logoData?.imageUrl) {
          this.logoImage = { filePath: logoData.imageUrl };
          localStorage.setItem('companyLogo', logoData.imageUrl);
        }
      }

      if (!localStorage.getItem('companyPdf')) {
        const pdfData = await this.uploadService.getImages('pdf').toPromise();
        if (pdfData?.imageUrl) {
          this.pdfImage = { filePath: pdfData.imageUrl };
          localStorage.setItem('companyPdf', pdfData.imageUrl);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar imagens:', error);
    }
  }
}
