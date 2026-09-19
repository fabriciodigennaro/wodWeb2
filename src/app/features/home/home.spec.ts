import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { type TimerConfig, TimerKind } from '@core/timer/config';
import { RecentWorkoutsService } from '@core/services/recent-workouts.service';
import { TimerSessionService } from '../timers/session/timer-session.service';
import { HomeComponent } from './home';

describe('HomeComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('lists all seven timer kinds with links to their setup', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    const links = fixture.nativeElement.querySelectorAll('nav a');
    expect(links.length).toBe(7);
    expect(links[0].getAttribute('href')).toBe('/timers/setup/amrap');
  });

  it('starts with AMRAP as the first entry', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    expect(fixture.componentInstance.timers[0].kind).toBe(TimerKind.Amrap);
  });

  it('does not show the recents section when there are no recent timers', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[aria-label="Recientes"]')).toBeNull();
  });

  it('shows recents and opens the selected one on the screen', async () => {
    const recents = TestBed.inject(RecentWorkoutsService);
    const session = TestBed.inject(TimerSessionService);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate');
    const config: TimerConfig = {
      kind: TimerKind.Emom,
      prepSeconds: 10,
      intervalSeconds: 60,
      rounds: 10,
    };
    await recents.remember(config);

    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('[aria-label="Recientes"]');
    expect(section).not.toBeNull();
    expect(section.textContent).toContain('EMOM · 10×60s');

    (section.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(session.config()).toEqual(config);
    expect(navigate).toHaveBeenCalledWith(['/timers/screen']);
  });
});
