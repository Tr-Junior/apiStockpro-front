import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { filter } from 'rxjs/operators';
import { Security } from '../../../../utils/Security.util';
import { User } from '../../../../models/user.model';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.css'],
    standalone: true,
    imports: [MenubarModule, CommonModule, AvatarModule, ButtonModule],
})
export class NavbarComponent implements OnInit {
    items: MenuItem[] = [];
    activeItem: MenuItem | undefined;
    public user!: User;

    constructor(private router: Router) {}

    ngOnInit() {
    this.user = Security.getUser();
        this.items = [
            {
                label: 'Produtos',
                icon: 'pi pi-list-check',
                routerLink: '/store',
            },
            {
                label: 'Frente de caixa',
                icon: 'pi pi-cart-plus',
                routerLink: '/sale',
            },
            {
                label: 'Orçamentos',
                icon: 'pi pi-list',
                routerLink: '/budgets',
            },
            {
              label: 'Pedidos',
              icon: 'pi pi-list-check',
              routerLink: '/productsToBuy',
            },
            {
                label: 'Faturamento',
                icon: 'pi pi-external-link',
                  items:[
                    {
                        label: 'Vendas',
                        icon: 'pi pi-cart-arrow-down',
                        routerLink: '/sales',
                    },
                    {
                      label: 'Faturamento mensal',
                      icon: 'pi pi-cart-arrow-down',
                      routerLink: '/features/details',
                  },
                  {
                    label: 'saidas',
                    icon: 'pi pi-cart-arrow-down',
                    routerLink: '/features/exits',
                }
                  ]
            },
        ];

        // Atualiza o item ativo com base na rota atual ao inicializar
        this.updateActiveItem(this.router.url);

        // Escuta mudanças de rota para atualizar o item ativo dinamicamente
        this.router.events
            .pipe(filter((event) => event instanceof NavigationEnd))
            .subscribe((event: any) => {
                this.updateActiveItem(event.urlAfterRedirects);
            });
    }

    updateActiveItem(url: string) {
        this.activeItem = this.items.find((item) => item.routerLink === url);
    }

    logout() {
        console.log('Logout');
    }
}
