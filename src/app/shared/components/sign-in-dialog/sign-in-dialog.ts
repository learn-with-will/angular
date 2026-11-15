import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { AuthProviderId } from '../../../core/firebase/firebase.config';
import { BrandMark } from '../brand-mark/brand-mark';

const LABELS: Record<AuthProviderId, string> = {
  google: 'Continue with Google',
  github: 'Continue with GitHub',
};

/**
 * The "save your progress" dialog. It is a native <dialog>, so the browser provides
 * the focus trap, the Escape key and the backdrop; this component only mirrors the
 * AuthService `dialogOpen` flag onto it. One instance lives in the app shell.
 */
@Component({
  selector: 'app-sign-in-dialog',
  imports: [BrandMark],
  templateUrl: './sign-in-dialog.html',
})
export class SignInDialog {
  protected readonly auth = inject(AuthService);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const el = this.dialog().nativeElement;
      const open = this.auth.dialogOpen();
      if (open && !el.open) el.showModal();
      else if (!open && el.open) el.close();
    });
  }

  protected label(id: AuthProviderId): string {
    return LABELS[id];
  }

  /** Escape (or anything else that closes the native dialog) must update our flag too. */
  protected onClosed(): void {
    this.auth.closeSignIn();
  }

  /** The dialog has no padding of its own, so a click that lands on it is a backdrop click. */
  protected onClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.auth.closeSignIn();
  }
}
