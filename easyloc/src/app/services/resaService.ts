import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ResaService {

  private api = 'http://localhost:5003/reservations';

  constructor(private http: HttpClient) {}

  getAll() {
        return this.http.get<any[]>(this.api);
  }

  getRequestById(reservationId: number) {
    return this.http.get<any>(`${this.api}/requests/${reservationId}`);
  }

  getUserResa(){
    return this.http.get(`${this.api}/requests`)


  }
  
}