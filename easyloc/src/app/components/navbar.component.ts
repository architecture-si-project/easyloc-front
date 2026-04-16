import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {

  isDarkMode = false;

  token: string | null = null;
  email: string | null = null;

  constructor(private auth: AuthService) {}

  ngOnInit() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.isDarkMode = savedTheme ? savedTheme === 'dark' : prefersDark;
    this.applyTheme(this.isDarkMode);

    this.auth.token$.subscribe(token => {
      this.token = token;
    });

    this.auth.email$.subscribe(email => {
      this.email = email;
    });
  }

  logout() {
    this.auth.logout();
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme(this.isDarkMode);
  }

  private applyTheme(isDark: boolean): void {
    document.documentElement.classList.toggle('dark', isDark);
    document.body?.classList.toggle('dark-mode', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }
}
