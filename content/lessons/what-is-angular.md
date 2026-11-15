---
slug: what-is-angular
title: "What Angular is"
topic: getting-started
kind: concept
summary: "A TypeScript framework from Google that bundles everything a single-page app needs."
tags: [angular, framework, spa, typescript]
related: [ng-new, modern-defaults, project-structure]
---
> **In one line:** Angular is a TypeScript-based, open-source framework from Google for building single-page applications, with the pieces you need already designed to work together.

## The idea

A single-page application (SPA) loads one HTML page and then redraws parts of it as the user clicks around, instead of asking the server for a whole new page each time. That is the style of most dashboards, shops and tools you use daily, and it needs a lot of machinery: a way to build screens, move between them, share data, validate forms and talk to a server.

Many libraries give you one of those pieces and leave you to choose the rest. Angular is a **complete platform**: the pieces ship together, follow one set of conventions, and are maintained by the same team. When you learn one, the others feel familiar. The tradeoff is that Angular has opinions, so you learn its way of doing things rather than assembling your own.

| Piece | What it does | You will meet it as |
|---|---|---|
| Components | build the screen from small, reusable parts | classes with a template |
| Templates | describe what a component shows | HTML plus `{{ }}`, `[ ]`, `( )` and `@if` |
| Signals | hold state that updates the screen | `signal()`, `computed()` |
| Dependency injection | share services between parts of the app | `inject()` |
| Router | move between screens by URL | routes and guards |
| Forms | collect and validate input | template-driven and reactive forms |
| HTTP client | talk to a server | `HttpClient` |

Everything is written in **TypeScript**, a typed layer over JavaScript. The compiler catches many mistakes, such as a misspelled property or a wrong argument, before the code ever runs, and your editor can autocomplete across the whole app.

## See it

An Angular app is a tree of components. This is a complete, if tiny, one:

```typescript
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-hello',
  template: `
    <h1>Hello, {{ name() }}!</h1>
    <button (click)="name.set('Angular')">Say hi</button>
  `,
})
export class Hello {
  protected readonly name = signal('world');
}
```

The class holds the data, the template shows it, and the framework keeps the two in sync. Every later lesson is a closer look at one part of this picture.

## Go deeper

You do not wire the pieces together yourself. A command-line tool, the Angular CLI, creates the project, runs it and builds it, and it does so with settings the Angular team maintains. That is why most Angular projects look alike, which makes it easy to read a colleague's code or pick up a new job.

Angular follows semantic versioning with a major release about twice a year, and each version has a documented upgrade path. This course is written for **Angular 20 and later**, and notes the version where a default changed.

## Watch out

- Older tutorials describe `NgModule`, `*ngIf` and `@Input()` decorators. They still work, but modern Angular uses standalone components, `@if` and `input()`.
- Angular is not the same thing as AngularJS (version 1.x). That framework is long retired and works very differently.

## Remember

- Angular is a complete platform: components, routing, forms, HTTP and more, designed together.
- It is written in TypeScript, so many mistakes are caught before the code runs.
- An app is a tree of components, and this course targets Angular 20 and later.
