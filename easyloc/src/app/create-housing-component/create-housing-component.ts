import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { HousingService } from '../services/HousingService';


@Component({
  selector: 'app-create-housing-component',
  standalone: true,
  imports: [ReactiveFormsModule], // ✅ THIS IS REQUIRED
  templateUrl: './create-housing-component.html',
  styleUrls: ['./create-housing-component.css'],
})
export class CreateHousingComponent {

  form = new FormGroup({
    title: new FormControl('', [Validators.required]),
    description: new FormControl(''),
    property_type: new FormControl('', [Validators.required]),
    location: new FormControl('', [Validators.required]),
    price_per_night: new FormControl(0, [Validators.required, Validators.min(1)]),
    available: new FormControl(true),
    owner_id: new FormControl(1)
  });

  isLoading = false;

  constructor(
    private housingService: HousingService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    this.housingService.createHousing(this.form.getRawValue()).subscribe({
      next: () => {
        this.toastr.success('Location créée avec succès !');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Erreur lors de la création');
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}