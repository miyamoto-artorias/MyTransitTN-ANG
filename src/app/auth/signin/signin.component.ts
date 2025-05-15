import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel, MatSuffix, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { HorizontalDividerComponent, LogoComponent } from '@elementar-ui/components';
import { AuthService, LoginRequest } from '../services/auth.service';
import { finalize } from 'rxjs';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [
    RouterLink,
    MatButton,
    MatFormField,
    MatLabel,
    MatInput,
    MatSuffix,
    MatError,
    ReactiveFormsModule,
    MatCheckbox,
    HorizontalDividerComponent,
    LogoComponent,
    NgIf
  ],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.scss'
})
export class SigninComponent {
  form: FormGroup;
  isLoading = false;
  loginError = '';
  
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  
  constructor() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [true]
    });
  }

  login(): void {
    if (this.form.invalid) {
      return;
    }
    
    this.isLoading = true;
    this.loginError = '';
    
    const loginRequest: LoginRequest = {
      email: this.form.value.email,
      password: this.form.value.password,
      'remember-me': this.form.value.rememberMe
    };
    
    this.authService.login(loginRequest)
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (error) => {
          console.error('Login error:', error);
          this.loginError = 'Invalid email or password. Please try again.';
        }
      });
  }
}
