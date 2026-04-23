import { Routes } from '@angular/router';
import { DashboardComponent } from './dashbord-component/dashboard-component';
import { CreateHousingComponent } from './create-housing-component/create-housing-component';
import { AuthGuard } from './services/AuthGuard';
import { ProfileComponent } from './profile-component/profile-component';
import { DetaileComponent } from './detaile-component/detaile-component';
import { ReservationPageComponent } from './pages/reservation-page.component';
import { LoginComponent } from './login-component/login-component';
import { SignUpComponent } from './sign-up-component/sign-up-component';
import { HomeComponent } from './pages/home.component';
import { TrackingPageComponent } from './pages/tracking-page.component';


export const routes: Routes = [{path:"login", component:LoginComponent},
    {path:"signup", component: SignUpComponent},
    {path: '',component: HomeComponent},
    {path:"dashboard", component:DashboardComponent,canActivate: [AuthGuard]},
    {path:"createRental",component:CreateHousingComponent, canActivate: [AuthGuard]},
    {path:"profile", component:ProfileComponent, canActivate: [AuthGuard]},
    {path:"details/:housingId", component:DetaileComponent, canActivate: [AuthGuard]},
    { path: 'reservation',component: ReservationPageComponent, canActivate: [AuthGuard]},
    {path: 'suivi-demandes',component: TrackingPageComponent, canActivate: [AuthGuard]},                   
];
