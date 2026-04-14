import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class HousingService {

  private api = 'http://localhost:5002/housing';

  constructor(private http: HttpClient) {}

  getAll() {
        return this.http.get<any[]>(this.api);
  }
  createHousing(data: any) {
        return this.http.post('http://localhost:5002/housing', data);
}
}