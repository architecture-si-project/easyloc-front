import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HousingService } from '../services/HousingService';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashbord-component',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './dashbord-component.html',
  styleUrls: ['./dashbord-component.css'],
})
export class DashboardComponent implements OnInit {

  allHousings: any[] = [];
  housings: any[] = [];
  isLoading = true;

  // Filter properties
  searchCity = '';
  selectedType = '';
  minPrice = 0;
  maxPrice = 1000;

  constructor(
    private housingService: HousingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadHousings();
  }

  loadHousings(): void {
    this.isLoading = true;

    this.housingService.getAll().subscribe({
      next: (data) => {
        console.log('API DATA:', data);

        this.allHousings = [...(data ?? [])]; 
        this.applyFilters();
        this.isLoading = false;

        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('API ERROR:', err);

        this.allHousings = [];
        this.housings = [];
        this.isLoading = false;

        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    this.housings = this.allHousings.filter((house) => {
      const matchCity = house.location.toLowerCase().includes(this.searchCity.toLowerCase());
      const matchType = !this.selectedType || house.property_type.toLowerCase() === this.selectedType.toLowerCase();
      const matchPrice = house.price_per_night >= this.minPrice && house.price_per_night <= this.maxPrice;

      return matchCity && matchType && matchPrice;
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchCity = '';
    this.selectedType = '';
    this.maxPrice = 1000;
    this.applyFilters();
  }

  trackById(index: number, item: any): number {
    return item.id;
  }
}