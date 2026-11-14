import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';
import { AccountMenu } from '../account-menu/account-menu';
import { AngularLogo } from '../angular-logo/angular-logo';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, AngularLogo, AccountMenu],
  templateUrl: './navbar.html',
})
export class Navbar {
  protected readonly theme = inject(ThemeService);

  protected readonly links = [
    { path: '/', label: 'Home', icon: 'M3 11.5 12 4l9 7.5M5.5 9.8V20h13V9.8' },
    { path: '/lessons', label: 'Lessons', icon: 'M4 6h16M4 12h16M4 18h10' },
    {
      path: '/quiz',
      label: 'Quiz',
      icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9.6 9.6a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1.1.8-1.1 1.5M12 16.6v.01',
    },
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: 'M4 13h6V4H4v9Zm10 7h6v-9h-6v9ZM4 20h6v-4H4v4ZM14 8h6V4h-6v4Z',
    },
    { path: '/bookmarks', label: 'Bookmarks', icon: 'M6 4h12v16l-6-4-6 4V4Z' },
  ];
}
