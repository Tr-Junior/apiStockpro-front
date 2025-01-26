import { Component } from '@angular/core';
import { MessageService } from 'primeng/api';
import { DataService } from '../../../../core/services/data.service';
import { ImportsService } from '../../../../core/services/imports.service';
import { Image } from '../../../../core/models/image.model';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-upload-page',
  standalone: true,
  imports: [ImportsService.imports],
  providers: [ImportsService.providers, DataService, MessageService],
  templateUrl: './upload-page.component.html',
  styleUrl: './upload-page.component.css'
})
export class UploadPageComponent {
  files: File[] = [];
  totalSize: number = 0;
  totalSizePercent: number = 0;
  uploadType: 'logo' | 'pdf' = 'logo'; // Tipo de upload atual ('logo' ou 'pdf')
  logoImage: { filePath: string } | null = null;
  pdfImage: { filePath: string } | null = null;
  public imageUpload: Image[] = [];
  constructor(
    private messageService: MessageService,
    private service: DataService
  ) {}

  ngOnInit() {
    this.getImages();
  }
  choose(event: any, callback: () => void) {
    callback();
  }

  onRemoveTemplatingFile(event: any, file: File, removeFileCallback: (file: any, index: any) => void, index: number) {
    removeFileCallback(file, index);
    this.totalSize -= file.size;
    this.totalSizePercent = this.totalSize / 10;
  }

  onClearTemplatingUpload(clear: () => void) {
    clear();
    this.totalSize = 0;
    this.totalSizePercent = 0;
  }

  onTemplatedUpload(event?: any) {
    const formData = new FormData();

    // Adiciona cada arquivo com o nome original
    this.files.forEach((file) => {
      formData.append('file', file, file.name);
    });

    console.log('Enviando arquivos:', this.files); // Para depuração

    const uploadObservable = this.uploadType === 'logo'
      ? this.service.uploadLogo(formData)
      : this.service.uploadPdf(formData);

    uploadObservable.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Upload Concluído',
          detail: `${this.uploadType.toUpperCase()} enviado com sucesso.`,
          life: 3000
        });

        // Buscar a imagem atualizada do banco de dados
        this.getImages();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro no Upload',
          detail: `Não foi possível enviar o ${this.uploadType.toUpperCase()}.`,
          life: 3000
        });
      }
    });
  }


  onSelectedFiles(event: any) {
    this.files = event.currentFiles;
    console.log('Arquivos selecionados:', this.files); // Verifique se os arquivos estão sendo capturados corretamente
    this.totalSize = this.files.reduce((sum, file) => sum + file.size, 0);
    this.totalSizePercent = this.totalSize / 10;
  }

  uploadEvent(callback: () => void) {
    // Aqui chamamos diretamente o upload, em vez de passar o callback sem fazer nada
    this.onTemplatedUpload(); // Chame a função de upload real
  }

  changeUploadType(type: 'logo' | 'pdf') {
    this.uploadType = type;
  }

  getImages() {
    this.service.getImages('logo').subscribe(
      (data: Image) => {
        if (data && data.imageUrl) {
          this.logoImage = { filePath: data.imageUrl };
          console.log('Logo carregada do banco:', this.logoImage);
          localStorage.setItem('companyLogo', data.imageUrl);
        } else {
          console.warn('Nenhuma logo encontrada');
        }
      },
      (error) => {
        console.error('Erro ao buscar logo:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro ao carregar logo',
          detail: 'Não foi possível carregar a logo.',
          life: 3000
        });
      }
    );

    this.service.getImages('pdf').subscribe(
      (data: Image) => {
        if (data && data.imageUrl) {
          this.pdfImage = { filePath: data.imageUrl };
          console.log('PDF carregado do banco:', this.pdfImage);
          localStorage.setItem('companyPdf', data.imageUrl);
        } else {
          console.warn('Nenhuma imagem de PDF encontrada');
        }
      },
      (error) => {
        console.error('Erro ao buscar PDF:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro ao carregar PDF',
          detail: 'Não foi possível carregar o PDF.',
          life: 3000
        });
      }
    );
  }
}
