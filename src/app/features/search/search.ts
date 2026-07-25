import { Component, computed, inject, signal } from '@angular/core';
import { SearchService } from '../../core/services/search.service';
import { LessonCard } from '../../shared/components/lesson-card/lesson-card';

@Component({
  selector: 'app-search',
  imports: [LessonCard],
  templateUrl: './search.html',
})
export class SearchPage {
  private readonly searchService = inject(SearchService);

  protected readonly query = signal('');
  protected readonly results = computed(() => this.searchService.search(this.query()));

  onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
}
