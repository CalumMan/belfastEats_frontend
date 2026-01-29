import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ReviewData, Review } from '../../services/review-data';

@Component({
  selector: 'app-my-reviews',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './my-reviews.html',
})
export class MyReviews implements OnInit {
  reviews: Review[] = [];
  loading = false;
  error: string | null = null;
  submitting = false;

  editingId: string | null = null;
  editForm!: FormGroup;

  constructor(
    public auth: AuthService,
    private reviewData: ReviewData,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.editForm = this.fb.group({
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      title: ['', [Validators.maxLength(120)]],
      comment: ['', [Validators.required, Validators.maxLength(500)]],
    });

    this.loadMyReviews();
  }

  ratingStars(value: any): any[] {
    const n = Math.max(0, Math.min(5, Number(value) || 0));
    return Array.from({ length: n });
  }

  private loadMyReviews() {
    if (!this.auth.isLoggedIn()) {
      this.error = 'Please log in to view your reviews.';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.error = null;

    this.reviewData.getMyReviews().subscribe({
      next: (data) => {
        this.reviews = data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.error || 'Could not load your reviews.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });

    // safety retry if still loading after 1s (handles occasional first-load glitch)
    setTimeout(() => {
      if (this.loading && !this.error) {
        this.loadMyReviews();
      }
    }, 1000);
  }

  startEdit(review: Review) {
    this.editingId = review.id;
    this.editForm.setValue({
      rating: review.rating,
      title: review.title || '',
      comment: review.comment || '',
    });
  }

  cancelEdit() {
    this.editingId = null;
    this.editForm.reset({
      rating: 5,
      title: '',
      comment: '',
    });
  }

  saveEdit(review: Review) {
    if (!this.editingId || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.submitting = true;
    const { rating, title, comment } = this.editForm.value;
    this.reviewData.updateReview(this.editingId, rating, comment, title).subscribe({
      next: (partial) => {
        // update local review
        const idx = this.reviews.findIndex((r) => r.id === review.id);
        if (idx >= 0) {
          this.reviews[idx] = {
            ...this.reviews[idx],
            rating,
            title,
            comment,
            ...partial,
          };
        }
        this.submitting = false;
        this.cancelEdit();
      },
      error: (err) => {
        this.error = err?.error?.error || 'Could not update review.';
        this.submitting = false;
      },
    });
  }

  deleteReview(review: Review) {
    if (!confirm('Delete this review?')) {
      return;
    }
    this.submitting = true;
    this.reviewData.deleteReview(review.id).subscribe({
      next: () => {
        this.reviews = this.reviews.filter((r) => r.id !== review.id);
        this.submitting = false;
      },
      error: (err) => {
        this.error = err?.error?.error || 'Could not delete review.';
        this.submitting = false;
      },
    });
  }
}
