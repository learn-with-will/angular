import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/components/navbar/navbar';
import { Footer } from './shared/components/footer/footer';
import { CourseService } from './core/services/course.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
})
export class App implements OnInit {
  private readonly course = inject(CourseService);

  ngOnInit(): void {
    // Load the manifest once at startup so every page has lesson metadata ready.
    void this.course.load();
  }
}
