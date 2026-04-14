import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home.component';
import { LoginComponent } from './login-component/login-component';
import { SignUpComponent } from './sign-up-component/sign-up-component';
import { DashbordComponent } from './dashbord-component/dashbord-component';
import { CreateHousingComponent } from './create-housing-component/create-housing-component';
import { AuthGuard } from './services/AuthGuard';


export const routes: Routes = [{path:"login", component:LoginComponent},
    {path:"signup", component: SignUpComponent},
    {path: '',component: HomeComponent},
    {path:"dashbord", component:DashbordComponent,canActivate: [AuthGuard]},
    {path:"createLocation",component:CreateHousingComponent, canActivate: [AuthGuard]}
];
    