import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/components/navbar/navbar';
import { Footer } from './shared/components/footer/footer';
import { CourseService } from './core/services/course.service';
import { ProgressService } from './core/services/progress.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
})
export class App implements OnInit {
  private readonly course = inject(CourseService);
  private readonly progress = inject(ProgressService);

  ngOnInit(): void {
    // Load the manifest once at startup so every page has lesson metadata ready,
    // then fold any v1 progress into the new per-bite progress.
    this.course
      .load()
      .then(() => this.progress.importLegacy(this.course.legacyEntries()))
      .catch(() => {
        /* a failed load is surfaced by the pages that need the manifest */
      });
  }
}
