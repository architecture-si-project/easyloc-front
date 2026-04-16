import { Component } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { API_BASE_URLS } from '../core/api.config';

@Component({
  selector: 'app-sign-up-component',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './sign-up-component.html',
  styleUrls: ['./sign-up-component.css'],
})
export class SignUpComponent {

  signUpForm = new FormGroup({
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5)],
    }),
  }); 

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastr: ToastrService
  ) {}

  signup(): void {
    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();
      return;
    }

    const payload = {
      email: this.signUpForm.value.email?.trim(),
      name: this.signUpForm.value.name?.trim(),
      password: this.signUpForm.value.password?.trim(),
    };

    console.log('payload sent:', payload); 
    this.http.post<any>(
      `${API_BASE_URLS.user}/auth/register`,
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

        this.toastr.success('Compte créé avec succès !');

        this.signUpForm.reset();

        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('ERROR:', err);
        console.error('BACKEND:', err.error);

        if (err.status === 409) {
          this.toastr.error('Email déjà utilisé');
        } else {
          this.toastr.error("Erreur lors de l'inscription");
        }
      }
    });
  }
}