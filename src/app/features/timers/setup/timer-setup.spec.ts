import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { vi } from 'vitest';
import { TimerKind, type TimerConfig } from '@core/timer/config';
import { TimerSessionService } from '../session/timer-session.service';
import { TimerSetupComponent } from './timer-setup';

function configure(kind: TimerKind): void {
  TestBed.configureTestingModule({
    imports: [TimerSetupComponent],
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: { paramMap: { get: (key: string) => (key === 'kind' ? kind : null) } },
        },
      },
    ],
  });
}

describe('TimerSetupComponent', () => {
  it('shows the AMRAP form with sensible defaults', () => {
    configure(TimerKind.Amrap);
    const fixture = TestBed.createComponent(TimerSetupComponent);
    fixture.detectChanges();

    const minutes = fixture.nativeElement.querySelector('#amrap-minutes') as HTMLInputElement;
    const seconds = fixture.nativeElement.querySelector('#amrap-seconds') as HTMLInputElement;
    const prep = fixture.nativeElement.querySelector('#amrap-prep') as HTMLInputElement;
    expect(minutes.value).toBe('20');
    expect(seconds.value).toBe('0');
    expect(prep.value).toBe('10');

    const start = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Empezar'),
    );
    expect(start.disabled).toBe(false);
  });

  it('disables start when the duration is zero', () => {
    configure(TimerKind.Amrap);
    const fixture = TestBed.createComponent(TimerSetupComponent);
    fixture.detectChanges();

    const minutes = fixture.nativeElement.querySelector('#amrap-minutes') as HTMLInputElement;
    minutes.value = '0';
    minutes.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const start = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Empezar'),
    );
    expect(start.disabled).toBe(true);
  });

  it('stores the AMRAP config and navigates to the timer screen', () => {
    configure(TimerKind.Amrap);
    const router = TestBed.inject(Router);
    const session = TestBed.inject(TimerSessionService);
    const navigate = vi.spyOn(router, 'navigate');

    const fixture = TestBed.createComponent(TimerSetupComponent);
    fixture.detectChanges();
    const start = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Empezar'),
    );
    start.click();
    fixture.detectChanges();

    const expected: TimerConfig = { kind: TimerKind.Amrap, prepSeconds: 10, durationSeconds: 1200 };
    expect(session.config()).toEqual(expected);
    expect(navigate).toHaveBeenCalledWith(['/timers/screen']);
  });

  it('shows the EMOM form with sensible defaults', () => {
    configure(TimerKind.Emom);
    const fixture = TestBed.createComponent(TimerSetupComponent);
    fixture.detectChanges();

    const interval = fixture.nativeElement.querySelector('#emom-interval') as HTMLInputElement;
    const rounds = fixture.nativeElement.querySelector('#emom-rounds') as HTMLInputElement;
    const prep = fixture.nativeElement.querySelector('#emom-prep') as HTMLInputElement;
    expect(interval.value).toBe('60');
    expect(rounds.value).toBe('10');
    expect(prep.value).toBe('10');

    const start = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Empezar'),
    );
    expect(start.disabled).toBe(false);
  });

  it('disables EMOM start with an invalid interval', () => {
    configure(TimerKind.Emom);
    const fixture = TestBed.createComponent(TimerSetupComponent);
    fixture.detectChanges();

    const interval = fixture.nativeElement.querySelector('#emom-interval') as HTMLInputElement;
    interval.value = '0';
    interval.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const start = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Empezar'),
    );
    expect(start.disabled).toBe(true);
  });

  it('stores the EMOM config and navigates to the timer screen', () => {
    configure(TimerKind.Emom);
    const router = TestBed.inject(Router);
    const session = TestBed.inject(TimerSessionService);
    const navigate = vi.spyOn(router, 'navigate');

    const fixture = TestBed.createComponent(TimerSetupComponent);
    fixture.detectChanges();
    const start = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Empezar'),
    );
    start.click();
    fixture.detectChanges();

    const expected: TimerConfig = {
      kind: TimerKind.Emom,
      prepSeconds: 10,
      intervalSeconds: 60,
      rounds: 10,
    };
    expect(session.config()).toEqual(expected);
    expect(navigate).toHaveBeenCalledWith(['/timers/screen']);
  });

  it('shows the For Time form with no cap by default', () => {
    configure(TimerKind.ForTime);
    const fixture = TestBed.createComponent(TimerSetupComponent);
    fixture.detectChanges();

    const minutes = fixture.nativeElement.querySelector('#fortime-cap-minutes') as HTMLInputElement;
    const seconds = fixture.nativeElement.querySelector('#fortime-cap-seconds') as HTMLInputElement;
    const prep = fixture.nativeElement.querySelector('#fortime-prep') as HTMLInputElement;
    expect(minutes.value).toBe('0');
    expect(seconds.value).toBe('0');
    expect(prep.value).toBe('10');

    const start = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Empezar'),
    );
    expect(start.disabled).toBe(false);
  });

  it('disables For Time start when the cap seconds exceed 59', () => {
    configure(TimerKind.ForTime);
    const fixture = TestBed.createComponent(TimerSetupComponent);
    fixture.detectChanges();

    const seconds = fixture.nativeElement.querySelector('#fortime-cap-seconds') as HTMLInputElement;
    seconds.value = '75';
    seconds.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const start = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Empezar'),
    );
    expect(start.disabled).toBe(true);
  });

  it('stores a cap-less For Time config and navigates to the timer screen', () => {
    configure(TimerKind.ForTime);
    const router = TestBed.inject(Router);
    const session = TestBed.inject(TimerSessionService);
    const navigate = vi.spyOn(router, 'navigate');

    const fixture = TestBed.createComponent(TimerSetupComponent);
    fixture.detectChanges();
    const start = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Empezar'),
    );
    start.click();
    fixture.detectChanges();

    const expected: TimerConfig = {
      kind: TimerKind.ForTime,
      prepSeconds: 10,
      timeCapSeconds: null,
    };
    expect(session.config()).toEqual(expected);
    expect(navigate).toHaveBeenCalledWith(['/timers/screen']);
  });

  it('stores a capped For Time config', () => {
    configure(TimerKind.ForTime);
    const router = TestBed.inject(Router);
    const session = TestBed.inject(TimerSessionService);
    vi.spyOn(router, 'navigate');

    const fixture = TestBed.createComponent(TimerSetupComponent);
    fixture.detectChanges();
    const minutes = fixture.nativeElement.querySelector('#fortime-cap-minutes') as HTMLInputElement;
    minutes.value = '15';
    minutes.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const start = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Empezar'),
    );
    start.click();
    fixture.detectChanges();

    expect(session.config()).toEqual({
      kind: TimerKind.ForTime,
      prepSeconds: 10,
      timeCapSeconds: 900,
    });
  });

  it('shows the Tabata form with sensible defaults', () => {
    configure(TimerKind.Tabata);
    const fixture = TestBed.createComponent(TimerSetupComponent);
    fixture.detectChanges();

    const work = fixture.nativeElement.querySelector('#tabata-work') as HTMLInputElement;
    const rest = fixture.nativeElement.querySelector('#tabata-rest') as HTMLInputElement;
    const rounds = fixture.nativeElement.querySelector('#tabata-rounds') as HTMLInputElement;
    expect(work.value).toBe('20');
    expect(rest.value).toBe('10');
    expect(rounds.value).toBe('8');

    const start = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Empezar'),
    );
    expect(start.disabled).toBe(false);
  });

  it('disables Tabata start when work is zero', () => {
    configure(TimerKind.Tabata);
    const fixture = TestBed.createComponent(TimerSetupComponent);
    fixture.detectChanges();

    const work = fixture.nativeElement.querySelector('#tabata-work') as HTMLInputElement;
    work.value = '0';
    work.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const start = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Empezar'),
    );
    expect(start.disabled).toBe(true);
  });

  it('stores the Tabata config and navigates to the timer screen', () => {
    configure(TimerKind.Tabata);
    const router = TestBed.inject(Router);
    const session = TestBed.inject(TimerSessionService);
    const navigate = vi.spyOn(router, 'navigate');

    const fixture = TestBed.createComponent(TimerSetupComponent);
    fixture.detectChanges();
    const start = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Empezar'),
    );
    start.click();
    fixture.detectChanges();

    const expected: TimerConfig = {
      kind: TimerKind.Tabata,
      prepSeconds: 10,
      workSeconds: 20,
      restSeconds: 10,
      rounds: 8,
    };
    expect(session.config()).toEqual(expected);
    expect(navigate).toHaveBeenCalledWith(['/timers/screen']);
  });

  it('shows the Interval form with sensible defaults', () => {
    configure(TimerKind.Interval);
    const fixture = TestBed.createComponent(TimerSetupComponent);
    fixture.detectChanges();

    const work = fixture.nativeElement.querySelector('#interval-work') as HTMLInputElement;
    const rest = fixture.nativeElement.querySelector('#interval-rest') as HTMLInputElement;
    const rounds = fixture.nativeElement.querySelector('#interval-rounds') as HTMLInputElement;
    expect(work.value).toBe('60');
    expect(rest.value).toBe('30');
    expect(rounds.value).toBe('8');

    const start = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Empezar'),
    );
    expect(start.disabled).toBe(false);
  });

  it('disables Interval start when rounds is zero', () => {
    configure(TimerKind.Interval);
    const fixture = TestBed.createComponent(TimerSetupComponent);
    fixture.detectChanges();

    const rounds = fixture.nativeElement.querySelector('#interval-rounds') as HTMLInputElement;
    rounds.value = '0';
    rounds.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const start = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Empezar'),
    );
    expect(start.disabled).toBe(true);
  });

  it('stores the Interval config and navigates to the timer screen', () => {
    configure(TimerKind.Interval);
    const router = TestBed.inject(Router);
    const session = TestBed.inject(TimerSessionService);
    const navigate = vi.spyOn(router, 'navigate');

    const fixture = TestBed.createComponent(TimerSetupComponent);
    fixture.detectChanges();
    const start = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Empezar'),
    );
    start.click();
    fixture.detectChanges();

    const expected: TimerConfig = {
      kind: TimerKind.Interval,
      prepSeconds: 10,
      workSeconds: 60,
      restSeconds: 30,
      rounds: 8,
    };
    expect(session.config()).toEqual(expected);
    expect(navigate).toHaveBeenCalledWith(['/timers/screen']);
  });

  it('announces that other kinds are not ready yet', () => {
    configure(TimerKind.Countdown);
    const fixture = TestBed.createComponent(TimerSetupComponent);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Próximamente');
    expect(text).toContain('countdown');
  });
});
