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
  loadInitialData(): Promise<void> {
    return new Promise((resolve) => {
      this.listCompany().then(() => this.getImages()).finally(() => resolve());
    });
  }

  /**
   * Busca os dados da empresa e salva no localStorage
   */
  listCompany(): Promise<void> {
    return new Promise((resolve, reject) => {
      const savedData = localStorage.getItem('companyData');
      if (savedData) {
        this.company = [JSON.parse(savedData)];
        resolve();
      } else {
        this.companyService.getCompany().subscribe({
          next: (data: ICompany[]) => {
            this.company = data;
            if (data.length > 0) {
              localStorage.setItem('companyData', JSON.stringify(data[0]));
            }
            resolve();
          },
          error: (err: any) => {
            console.error('Erro ao buscar empresa:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: 'Erro ao carregar os dados da empresa'
            });
            reject();
          }
        });
      }
    });
  }

  /**
   * Busca a logo e o PDF da empresa e salva no localStorage
   */
  getImages(): Promise<void> {
    return new Promise((resolve) => {
      const savedLogo = localStorage.getItem('companyLogo');
      if (!savedLogo) {
        this.uploadService.getImages('logo').subscribe(
          (data: Image) => {
            if (data?.imageUrl) {
              this.logoImage = { filePath: data.imageUrl };
              localStorage.setItem('companyLogo', data.imageUrl);
            }
          },
          (error) => console.error('Erro ao buscar logo:', error)
        );
      }

      const savedPdf = localStorage.getItem('companyPdf');
      if (!savedPdf) {
        this.uploadService.getImages('pdf').subscribe(
          (data: Image) => {
            if (data?.imageUrl) {
              this.pdfImage = { filePath: data.imageUrl };
              localStorage.setItem('companyPdf', data.imageUrl);
            }
          },
          (error) => console.error('Erro ao buscar PDF:', error)
        );
      }

      resolve();
    });
  }
}
