import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';
import { AngularLogo } from '../angular-logo/angular-logo';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, AngularLogo],
  templateUrl: './navbar.html',
})
export class Navbar {
  protected readonly theme = inject(ThemeService);

  protected readonly links = [
    { path: '/', label: 'Home', icon: 'M3 11.5 12 4l9 7.5M5.5 9.8V20h13V9.8' },
    {
      path: '/roadmap',
      label: 'Roadmap',
      icon: 'M9 4.5 3 7v12.5l6-2.5 6 2.5 6-2.5V4.5l-6 2.5-6-2.5Zm0 0v12.5m6-10v12.5',
    },
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: 'M4 13h6V4H4v9Zm10 7h6v-9h-6v9ZM4 20h6v-4H4v4ZM14 8h6V4h-6v4Z',
    },
    { path: '/bookmarks', label: 'Bookmarks', icon: 'M6 4h12v16l-6-4-6 4V4Z' },
  ];
}
