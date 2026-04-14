import { Component, OnInit } from '@angular/core';
import { HousingService } from '../services/HousingService';

@Component({
  selector: 'app-dashbord-component',
  standalone: true,
  imports: [],
  templateUrl: './dashbord-component.html',
  styleUrl: './dashbord-component.css',
})
export class DashbordComponent implements OnInit {

  housings: any[] = [];
  isLoading = true;

  constructor(private housingService: HousingService) {}

  ngOnInit(): void {
    this.housingService.getAll().subscribe({
      next: (data) => {
        this.housings = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }
}
