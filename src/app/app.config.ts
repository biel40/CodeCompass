import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { SupabaseService } from './core/services/supabase.service';
import { AuthService } from './core/services/auth.service';
import { MockSupabaseService } from './core/services/supabase.service.mock';
import { MockAuthService } from './core/services/auth.service.mock';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withFetch()),
    environment.useMocks
      ? [
          { provide: SupabaseService, useClass: MockSupabaseService },
          { provide: AuthService, useClass: MockAuthService },
        ]
      : [SupabaseService, AuthService],
  ],
};
