import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { API_BASE_URLS } from '../core/api.config';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login-component',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-component.html',
  styleUrls: ['./login-component.css'],
})
export class LoginComponent {

  loginForm = new FormGroup({
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  isLoading = false; 

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastr: ToastrService,
    private auth: AuthService
  ) {}

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    
    const payload = {
      email: this.loginForm.value.email?.trim() || '',
      password: this.loginForm.value.password?.trim() || '',
    };



    this.isLoading = true;

    this.http.post<any>(
      `${API_BASE_URLS.user}/auth/login`,
      payload,
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      }
    )
    .subscribe({
      next: (res) => {

        if (res.token) {
          this.auth.login(res.token, payload.email); 



        }
        this.toastr.success('Connexion réussie !');

        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('ERROR:', err);
        console.error('BACKEND:', err.error);

        if (err.status === 401) {
          this.toastr.error('Email ou mot de passe incorrect');
        } else {
          this.toastr.error('Erreur serveur');
        }
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}