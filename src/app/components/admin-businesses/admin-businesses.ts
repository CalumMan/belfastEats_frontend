import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';

import { BusinessData } from '../../services/business-data';

@Component({
  selector: 'app-admin-businesses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './admin-businesses.html',
})
export class AdminBusinesses implements OnInit {
  businesses: any[] = [];
  loading = false;
  error: string | null = null;
  success: string | null = null;
  stats: { restaurants_count: number; reviews_count: number; average_rating: number | null } | null = null;
  statsLoading = false;
  statsError: string | null = null;

  createForm!: FormGroup;
  editForm!: FormGroup;
  editingId: string | null = null;
  submitting = false;

  constructor(private businessData: BusinessData, private fb: FormBuilder, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.createForm = this.fb.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
      postcode: ['', Validators.required],
      hygiene_rating: [0, [Validators.required, Validators.min(0), Validators.max(5)]],
      cuisine: ['', Validators.required],
      tags: [''],
      lat: [''],
      lng: [''],
    });

    this.editForm = this.fb.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
      postcode: ['', Validators.required],
      hygiene_rating: [0, [Validators.required, Validators.min(0), Validators.max(5)]],
      cuisine: ['', Validators.required],
      tags: [''],
      lat: [''],
      lng: [''],
    });

    this.load();
    this.loadStats();
  }

  private load() {
    this.loading = true;
    this.error = null;
    this.success = null;
    this.businessData.loadBusinesses().subscribe({
      next: (data) => {
        this.businesses = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.error || 'Could not load businesses.';
        this.loading = false;
      },
    });
  }

  private loadStats() {
    this.statsLoading = true;
    this.statsError = null;
    this.businessData.getStats().subscribe({
      next: (s) => {
        this.stats = s;
        this.statsLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.statsError =
          err?.error?.error || 'Could not load statistics.';
        this.statsLoading = false;
        console.error('Failed to load stats', err);
        this.cdr.detectChanges();
      },
    });

    // Fallback retry if still loading after 800ms (helps first navigation hiccups)
    setTimeout(() => {
      if (this.statsLoading && !this.stats) {
        this.loadStats();
      }
    }, 800);
  }

  startEdit(biz: any) {
    this.editingId = biz._id;
    this.editForm.setValue({
      name: biz.name || '',
      address: biz.address || '',
      postcode: biz.postcode || '',
      hygiene_rating: biz.hygiene_rating ?? 0,
      cuisine: biz.cuisine || '',
      tags: (biz.tags || []).join(', '),
      lat: biz.lat ?? '',
      lng: biz.lng ?? '',
    });
  }

  cancelEdit() {
    this.editingId = null;
    this.editForm.reset();
  }

  submitCreate() {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    this.submitting = true;
    const payload = this.preparePayload(this.createForm.value);
    this.businessData.createBusiness(payload).subscribe({
      next: () => {
        this.success = 'Business created.';
        this.submitting = false;
        this.createForm.reset({
          name: '',
          address: '',
          postcode: '',
          hygiene_rating: 0,
          cuisine: '',
          tags: '',
          lat: '',
          lng: '',
        });
        this.load();
      },
      error: (err) => {
        this.submitting = false;
        this.error = err?.error?.error || 'Failed to create business.';
      },
    });
  }

  submitEdit() {
    if (!this.editingId || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.submitting = true;
    const payload = this.preparePayload(this.editForm.value);
    this.businessData.updateBusiness(this.editingId, payload).subscribe({
      next: () => {
        this.success = 'Business updated.';
        this.submitting = false;
        this.cancelEdit();
        this.load();
      },
      error: (err) => {
        this.submitting = false;
        this.error = err?.error?.error || 'Failed to update business.';
      },
    });
  }

  deleteBusiness(id: string) {
    if (!confirm('Delete this business?')) {
      return;
    }
    this.submitting = true;
    this.businessData.deleteBusiness(id).subscribe({
      next: () => {
        this.success = 'Business deleted.';
        this.submitting = false;
        this.load();
      },
      error: (err) => {
        this.submitting = false;
        this.error = err?.error?.error || 'Failed to delete business.';
      },
    });
  }

  private preparePayload(raw: any) {
    return {
      name: raw.name,
      address: raw.address,
      postcode: raw.postcode,
      hygiene_rating: Number(raw.hygiene_rating),
      cuisine: raw.cuisine,
      tags: String(raw.tags || '')
        .split(',')
        .map((t: string) => t.trim())
        .filter((t: string) => t.length),
      lat: raw.lat ? Number(raw.lat) : undefined,
      lng: raw.lng ? Number(raw.lng) : undefined,
    };
  }
}
