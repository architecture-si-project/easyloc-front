import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home.component';
import { LoginComponent } from './login-component/login-component';
import { SignUpComponent } from './sign-up-component/sign-up-component';
import { ReservationPageComponent } from './pages/reservation-page.component';
import { TrackingPageComponent } from './pages/tracking-page.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'signUp',
    redirectTo: 'signup',
    pathMatch: 'full',
  },
  {
    path: 'signup',
    component: SignUpComponent,
  },
  {
    path: 'reservation',
    component: ReservationPageComponent,
  },
  {
    path: 'suivi-demandes',
    component: TrackingPageComponent,
  },
];
