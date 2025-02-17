import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CompanyDataService } from '../core/services/company-data.service';
import { MessageService } from 'primeng/api';
import { ImportsService } from '../core/services/imports.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ImportsService.imports, RouterOutlet],
    providers: [ImportsService.providers, MessageService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  title = 'frontend';

  constructor(private companyDataService: CompanyDataService) {}

  async ngOnInit(): Promise<void> {
    await this.companyDataService.loadInitialData();
  }
}
