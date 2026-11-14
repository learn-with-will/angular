import { Component, ElementRef, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { CloudSyncService, SyncState } from '../../../core/sync/cloud-sync.service';

/** Wording and dot colour for each sync state; also used by the dashboard. */
export const SYNC_LABELS: Record<SyncState, { text: string; dot: string }> = {
  off: { text: 'Not signed in', dot: 'bg-ink-300' },
  connecting: { text: 'Connecting…', dot: 'bg-amber-400' },
  synced: { text: 'Saved to your account', dot: 'bg-emerald-500' },
  saving: { text: 'Saving…', dot: 'bg-amber-400' },
  offline: { text: 'Offline, will save when you are back', dot: 'bg-amber-400' },
  error: { text: 'Not syncing, progress is only on this device', dot: 'bg-rose-500' },
};

/**
 * Top-bar account control. Signed out it is a "Sign in" button; signed in it is an
 * avatar with a small panel (who you are, sync status, sign out). It renders
 * nothing at all when Firebase is not configured.
 */
@Component({
  selector: 'app-account-menu',
  templateUrl: './account-menu.html',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'close()',
  },
})
export class AccountMenu {
  protected readonly auth = inject(AuthService);
  private readonly sync = inject(CloudSyncService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly open = signal(false);

  protected readonly syncInfo = computed(() => SYNC_LABELS[this.sync.state()]);

  protected readonly displayName = computed(() => {
    const u = this.auth.user();
    return u?.name || u?.email || 'Your account';
  });

  protected readonly initial = computed(() => this.displayName().trim().charAt(0).toUpperCase());

  protected toggle(): void {
    this.open.update((v) => !v);
  }

  protected close(): void {
    this.open.set(false);
  }

  protected async signOut(): Promise<void> {
    this.close();
    await this.auth.signOut();
  }

  protected onDocumentClick(event: Event): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) this.close();
  }
}
