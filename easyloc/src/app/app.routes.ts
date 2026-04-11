import { Routes } from '@angular/router';
import { LoginComponent } from './login-component/login-component';
import { SignUpComponent } from './sign-up-component/sign-up-component';


export const routes: Routes = [{path:"login", component:LoginComponent},
    {path:"signUp", component: SignUpComponent}
];
