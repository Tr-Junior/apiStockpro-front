import { HttpClient, HttpHeaders, HttpClientModule, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Product, ProductResponse } from "../models/product.model";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment.development";
import { Security } from "../../utils/Security.util";
import { Exits } from "../models/exits.model";
import { Entrances } from "../models/entrances.model";
import { Budget } from "../models/budget.model";
import { Order } from "../models/order.models";
import { ProductsBuy } from "../models/productsBuy-model";
import { Supplier } from "../models/supplier-model";
import { User } from "../models/user.model";
import { ICompany } from "../models/company.model";
import { Image } from "../models/image.model";


@Injectable({
  providedIn: 'root'
})
export class DataService {


  public API = `${environment.API}`;

  constructor(private http: HttpClient) { }

  public composeHeaders() {
    const token = Security.getToken();
    const headers = new HttpHeaders().set('x-access-token', token);
    return headers;

  }

  searchProduct(data: any): Observable<any> {
    return this.http.post<any>(`${this.API}/products/search`, data, { headers: this.composeHeaders() });
  }

  getProductById(id: any): Observable<any> {
    return this.http.get(`${this.API}/products/getById/` + id, { headers: this.composeHeaders() });
  }
  getProducts(params: any) {
    return this.http.get<ProductResponse>(`${this.API}/products`, {
      headers: this.composeHeaders(),
      params: new HttpParams({ fromObject: params })
    });
  }

  createProduct(data: any) {
    return this.http.post(`${this.API}/products`, data, { headers: this.composeHeaders() });
  }

  updateProduct(data: any): Observable<any> {
    return this.http.put(`${this.API}/products/updateBody`, data, { headers: this.composeHeaders() });
  }
  delProd(id: any): Observable<any> {
    return this.http.delete(`${this.API}/products/` + id, { headers: this.composeHeaders() })
  }

  // Saidas

  createExits(data: any) {
    return this.http.post(`${this.API}/exits`, data, { headers: this.composeHeaders() });
  }
  searchExits(description: string): Observable<Exits[]> {
    return this.http.get<Exits[]>(`${this.API}/exits/search/` + description, { headers: this.composeHeaders() });
  }
  getExits(): Observable<any> {
    return this.http.get<Exits[]>(`${this.API}/exits`, { headers: this.composeHeaders() });
  }
  getExitsById(id: any): Observable<any> {
    return this.http.get(`${this.API}/exits/getById/` + id, { headers: this.composeHeaders() });
  }
  updateExits(data: any): Observable<any> {
    return this.http.put(`${this.API}/exits/update`, data, { headers: this.composeHeaders() });
  }
  delExits(id: any): Observable<any> {
    return this.http.delete(`${this.API}/exits/` + id, { headers: this.composeHeaders() });
  }

  // Entradas

  getEntrances(): Observable<any> {
    return this.http.get<Entrances[]>(`${this.API}/entrance`, { headers: this.composeHeaders() });
  }
  getEntrancesById(id: any): Observable<any> {
    return this.http.get(`${this.API}/entrance/getById/` + id, { headers: this.composeHeaders() });
  }
  delEntrances(id: any): Observable<any> {
    return this.http.delete(`${this.API}/entrance/` + id, { headers: this.composeHeaders() });
  }
  delEntrancesByCode(code: any): Observable<any> {
    return this.http.delete(`${this.API}/entrance/deleteByCode/` + code, { headers: this.composeHeaders() });
  }

  // Vendas

  createOrder(data: any) {
    return this.http.post(`${this.API}/orders`, data, { headers: this.composeHeaders() });
  }

  getOrder(): Observable<any> {
    return this.http.get<Order[]>(`${this.API}/orders/sales`, { headers: this.composeHeaders() });
  }

  getOrderByDateRange(startDate?: Date, endDate?: Date): Observable<Order[]> {
    const url = `${this.API}/orders/sales`;
    const body = {
      startDate: startDate ? startDate.toISOString() : undefined,
      endDate: endDate ? endDate.toISOString() : undefined
    };

    return this.http.post<Order[]>(url, body, { headers: this.composeHeaders() });
  }



  getOrderById(id: any): Observable<any> {
    return this.http.get(`${this.API}/orders/getById/` + id, { headers: this.composeHeaders() });
  }
  delOrder(id: any): Observable<any> {
    return this.http.delete(`${this.API}/orders/` + id, { headers: this.composeHeaders() });
  }
  delOrderByCode(code: any): Observable<any> {
    return this.http.delete(`${this.API}/orders/deleteByCode/` + code, { headers: this.composeHeaders() });
  }


  //Autenticação


  authenticate(data: any) {
    return this.http.post(`${this.API}/customers/authenticate`, data);
  }
  refreshToken() {
    return this.http.post(`${this.API}/customers/refresh-token`, null, { headers: this.composeHeaders() });
  }

  validatePassword(data: any): Observable<{ valid: boolean }> {
    return this.http.post<{ valid: boolean }>(`${this.API}/customers/validate-password`, data, { headers: this.composeHeaders() });
  }


  //Usuario

  createUser(data: any) {
    return this.http.post(`${this.API}/customers`, data, { headers: this.composeHeaders() });
  }
  getUserById(id: any): Observable<any> {
    return this.http.get<User[]>(`${this.API}/customers/getById/${id}`, { headers: this.composeHeaders() });
  }
  updatePassword(data: any): Observable<any> {
    return this.http.put(`${this.API}/customers/update-password`, data, { headers: this.composeHeaders() });
  }
  checkUsernameExists(name: string) {
    return this.http.get<boolean>(`${this.API}/customers/check-username/${name}`, { headers: this.composeHeaders() });
  }


  //orçamentos

  createBudget(data: any) {
    return this.http.post(`${this.API}/budget`, data, { headers: this.composeHeaders() });
  }
  getBudget(): Observable<any> {
    return this.http.get<Budget[]>(`${this.API}/budget`, { headers: this.composeHeaders() });
  }
  getBudgetById(id: any): Observable<any> {
    return this.http.get(`${this.API}/budget/getById/` + id, { headers: this.composeHeaders() });
  }
  delBudget(id: any): Observable<any> {
    return this.http.delete(`${this.API}/budget/` + id, { headers: this.composeHeaders() });
  }
  delBudgetByCode(code: any): Observable<any> {
    return this.http.delete(`${this.API}/budget/deleteByCode/` + code, { headers: this.composeHeaders() });
  }

  updateClientName(data: any) {
    return this.http.put(`${this.API}/budget/update-client-name`, data, { headers: this.composeHeaders() });
  }

  removeItemFromBudget(budgetId: string, itemId: string, quantityToRemove: number) {
    return this.http.put(`${this.API}/budget/remove-item`, { id: budgetId, itemId, quantityToRemove }, { headers: this.composeHeaders() });
  }

  //compras de produtos

  createProductBuy(data: any) {
    return this.http.post(`${this.API}/productBuy`, data, { headers: this.composeHeaders() });
  }
  getProductBuy(): Observable<any> {
    return this.http.get<ProductsBuy[]>(`${this.API}/productBuy`, { headers: this.composeHeaders() });
  }
  updateProductBuy(data: any): Observable<any> {
    return this.http.put(`${this.API}/productBuy/update`, data, { headers: this.composeHeaders() });
  }
  delProductBuy(id: any): Observable<any> {
    return this.http.delete(`${this.API}/productBuy/` + id, { headers: this.composeHeaders() });
  }

  searchProductBuy(data: any): Observable<ProductsBuy[]> {
    return this.http.post<ProductsBuy[]>(`${this.API}/productBuy/search`, data, { headers: this.composeHeaders() });
  }

  //fornecedores

  createSupplier(data: any) {
    return this.http.post(`${this.API}/supplier`, data, { headers: this.composeHeaders() });
  }
  getSupplier(): Observable<any> {
    return this.http.get<Supplier[]>(`${this.API}/supplier`, { headers: this.composeHeaders() });
  }
  updateSupplier(data: any): Observable<any> {
    return this.http.put(`${this.API}/supplier/updateBody`, data, { headers: this.composeHeaders() });
  }
  delSupplier(id: any): Observable<any> {
    return this.http.delete(`${this.API}/supplier/` + id, { headers: this.composeHeaders() });
  }

  //companyInfo
getCompany(): Observable<any> {
return this.http.get<ICompany[]>(`${this.API}/companyInfo/company`, { headers: this.composeHeaders() });
}

getCompanyId(id: any): Observable<any> {
  return this.http.get(`${this.API}/companyInfo/company/` + id, { headers: this.composeHeaders() });
  }

createCompany(data: any): Observable<any> {
  return this.http.post(`${this.API}/companyInfo/company`, data, { headers: this.composeHeaders() });
}

updateCompany(id: any, data: any): Observable<any> {
  return this.http.put(`${this.API}/companyInfo/company/`+ id, data, { headers: this.composeHeaders() });
}

findCep(data: any): Observable<any> {
  return this.http.post(`${this.API}/api/cep`, data, { headers: this.composeHeaders() });
}


//logo upload
uploadLogo(data: FormData): Observable<{ image: { filePath: string } }> {
  console.log('Enviando logo para o servidor:', data);
  return this.http.post<{ image: { filePath: string } }>(
    `${this.API}/image/upload/logo`,
    data,
    { headers: this.composeHeaders() }
  );
}

uploadPdf(data: FormData): Observable<{ image: { filePath: string } }> {
  console.log('Enviando PDF para o servidor:', data);
  return this.http.post<{ image: { filePath: string } }>(
    `${this.API}/image/upload/pdf`,
    data,
    { headers: this.composeHeaders() }
  );
}

getImages(type: string): Observable<Image> {
  return this.http.get<Image>(`${this.API}/image/image?type=${type}`, { headers: this.composeHeaders() });
}




}
