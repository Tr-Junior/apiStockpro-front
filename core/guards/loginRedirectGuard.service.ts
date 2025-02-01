import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Security } from '../../src/utils/Security.util';

@Injectable({
  providedIn: 'root'
})
export class LoginRedirectGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const user = Security.getPass();

    if (!user) {
      // Armazena a URL para redirecionamento pós-login
      sessionStorage.setItem('redirectRoute', state.url);

      // Identifica a rota de destino e redireciona apropriadamente
      if (state.url.startsWith('/sales')) {
        this.router.navigate(['/login-guard/login-sales']);
      } else if (state.url.startsWith('/features/exits')) {
        this.router.navigate(['/login-guard/login-entrance-exits']);
      } else {
        this.router.navigate(['/login']);
      }

      return false;
    }
    return true;
  }
}
