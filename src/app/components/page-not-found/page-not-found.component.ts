import { Component } from '@angular/core';
import { MessageService } from 'primeng/api';
import { DataService } from '../../../core/api/data.service';
import { ImportsService } from '../../../core/api/imports.service';

@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [ImportsService.imports],
    providers: [ImportsService.providers, DataService, MessageService],
  templateUrl: './page-not-found.component.html',
  styleUrl: './page-not-found.component.css'
})
export class PageNotFoundComponent {

}
