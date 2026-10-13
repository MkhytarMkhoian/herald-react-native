import { expect, test } from '@jest/globals';

import {
  isScreenView,
  isUserProperty,
  type Event,
  type ScreenViewEvent,
  type UserProperty,
} from '../index';
import { TestEvent, TestProperty } from './support';

// A label of the app's own, written the same way as Herald's.
interface PersonalDataEvent extends Event {
  readonly isPersonalData: true;
}

function isPersonalData(event: Event): event is PersonalDataEvent {
  return 'isPersonalData' in event && event.isPersonalData === true;
}

class ProfileViewed implements ScreenViewEvent, PersonalDataEvent {
  readonly name = 'profile';
  readonly isScreenView = true;
  readonly isPersonalData = true;
}

class Plan implements UserProperty {
  readonly name = 'plan';
  readonly value = 'pro';
  readonly isUserProperty = true;
}

test('an event carries any number of labels', () => {
  const event: Event = new ProfileViewed();

  expect(isScreenView(event)).toBe(true);
  expect(isPersonalData(event)).toBe(true);
});

test('an event without a label is not one', () => {
  expect(isScreenView(new TestEvent('checkout'))).toBe(false);
  expect(isPersonalData(new TestEvent('checkout'))).toBe(false);
});

test('only true counts, for objects from plain JavaScript', () => {
  expect(isScreenView({ name: 'home', isScreenView: 'yes' } as Event)).toBe(false);
});

test('a user property is labelled the same way', () => {
  expect(isUserProperty(new Plan())).toBe(true);
  expect(isUserProperty(new TestProperty('theme', 'dark'))).toBe(false);
});

test('a label without its field does not compile', () => {
  // @ts-expect-error ScreenViewEvent needs isScreenView = true
  class Home implements ScreenViewEvent {
    readonly name = 'home';
  }
  expect(new Home().name).toBe('home');
});
