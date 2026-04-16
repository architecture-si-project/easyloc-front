import { DashboardComponent } from './dashbord-component/dashboard-component';
import { CreateHousingComponent } from './create-housing-component/create-housing-component';
import { AuthGuard } from './services/AuthGuard';
import { ProfileComponent } from './profile-component/profile-component';
import { DetaileComponent } from './detaile-component/detaile-component';


export const routes: Routes = [{path:"login", component:LoginComponent},
    {path:"signup", component: SignUpComponent},
    {path: '',component: HomeComponent},
    {path:"dashboard", component:DashboardComponent,canActivate: [AuthGuard]},
    {path:"createRental",component:CreateHousingComponent, canActivate: [AuthGuard]},
    {path:"profile", component:ProfileComponent, canActivate: [AuthGuard]},
    {path:"details/:housingId", component:DetaileComponent, canActivate: [AuthGuard]},
    { path: 'reservation',component: ReservationPageComponent},
    {path: 'suivi-demandes',component: TrackingPageComponent,},                   
];
