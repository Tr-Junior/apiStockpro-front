import { Supplier } from './supplier-model';

export class Product {
  constructor(
    public _id: string,
    public codigo: string,
    public title: string,
    public quantity: number,
    public purchasePrice: number,
    public price: number,
    public supplier: Supplier
  ) { }
}
