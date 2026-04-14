import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
];
import { LoginComponent } from './login-component/login-component';
import { SignUpComponent } from './sign-up-component/sign-up-component';


export const routes: Routes = [{path:"login", component:LoginComponent},
    {path:"signUp", component: SignUpComponent}
];
