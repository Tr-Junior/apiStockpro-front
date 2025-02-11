import { Component } from '@angular/core';
import { ImportsService } from '../../../../core/services/imports.service';
import { UserService } from '../../../../core/api/user/user.service';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-user-management-page',
  standalone: true,
  imports: [ImportsService.imports],
    providers: [ImportsService.providers],
  templateUrl: './user-management-page.component.html',
  styleUrl: './user-management-page.component.css'
})
export class UserManagementPageComponent {

  user: User[] = [];
constructor(
  private userService: UserService
){

}

  ngOnInit(): void {
    this.getAllUsers();
  }

  getAllUsers(){
    this.userService.getAllUsers().subscribe({
      next: (data: User[]) => {
        this.user = data;
        console.log(this.user);
      },
      error: (error) => {
        console.error('Error fetching users', error);
      }
    })
  }

  deleteUser(userId: string){
    this.userService.deleteUser(userId).subscribe({
      next: () => {
        console.log('User deleted successfully');
        this.getAllUsers();
      },
      error: (error) => {
        console.error('Error deleting user', error);
      }
    })
  }

  editUser(user: any){}
}
