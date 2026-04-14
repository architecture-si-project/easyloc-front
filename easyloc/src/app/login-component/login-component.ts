import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

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
    private toastr: ToastrService
  ) {}

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    
    const payload = {
      email: this.loginForm.value.email?.trim(),
      password: this.loginForm.value.password?.trim(),
    };

    console.log('payload sent:', payload); 

    this.isLoading = true;

    this.http.post<any>(
      'http://localhost:5001/auth/login',
      payload,
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      }
    )
    .subscribe({
      next: (res) => {
        console.log('success', res);

        if (res.token) {
          sessionStorage.setItem('token', res.token);
        }

        this.toastr.success('Connexion réussie !');

        this.router.navigate(['/']);
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