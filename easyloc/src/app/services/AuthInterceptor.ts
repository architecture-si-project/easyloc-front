import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = sessionStorage.getItem('token');

  const isAuthRoute =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register');

  if (token && !isAuthRoute) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};