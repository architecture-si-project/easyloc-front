import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private tokenSubject = new BehaviorSubject<string | null>(this.getToken());
  token$ = this.tokenSubject.asObservable();

  private emailSubject = new BehaviorSubject<string | null>(this.getEmail());
  email$ = this.emailSubject.asObservable();

  constructor() {}

  login(token: string, email: string) {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('email', email);

    this.tokenSubject.next(token);
    this.emailSubject.next(email);
  }

  logout() {
    sessionStorage.clear();

    this.tokenSubject.next(null);
    this.emailSubject.next(null);
  }

  getToken() {
    return sessionStorage.getItem('token');
  }

  getEmail() {
    return sessionStorage.getItem('email');
  }
}