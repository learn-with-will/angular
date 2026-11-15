---
slug: ng-generate
title: "ng generate"
topic: getting-started
kind: tool
summary: "Scaffold components, services and more so every file follows Angular's conventions."
tags: [cli, schematics, scaffolding, naming]
related: [ng-new, project-structure, modern-defaults]
---
> **In one line:** `ng generate` (short form `ng g`) creates a component, service, directive or pipe with the right files, names and wiring in one step.

## The idea

You add pieces to an app constantly. Creating the class, template, stylesheet and test by hand is tedious, and small naming differences pile up across a team. `ng generate` uses **schematics**, templates the Angular team maintains, to create each piece the same way every time. It is like ordering pre-fab rooms that already match the building code.

Which schematic you want depends on what you are adding:

```tree
What do you want to add?
  Something on screen
    [c] Component | `ng g c greeting` @blue
  Logic or data shared between components
    [s] Service | `ng g s data` @green
  A behavior to attach to an element
    [d] Directive | `ng g d highlight` @amber
  A way to format a value
    [p] Pipe | `ng g p shorten` @primary
```

Since Angular 20, generated files no longer carry type suffixes such as `.component` or `.service`. A component named `greeting` produces `greeting.ts` with a class called `Greeting`, not `greeting.component.ts` and `GreetingComponent`. Older tutorials show the old names, which is only a convention change, not a bug.

## See it

```bash
ng generate component greeting
ng generate service data

# Preview any command without writing files
ng generate component features/checkout --dry-run
```

```text
src/app/greeting/
├── greeting.ts          # the component class: Greeting
├── greeting.html        # the template
├── greeting.css         # its styles
└── greeting.spec.ts     # a starter unit test
```

The generated component is standalone. It lists its own template dependencies in `imports` and needs no `NgModule`:

```typescript
@Component({
  selector: 'app-greeting',
  imports: [],
  templateUrl: './greeting.html',
  styleUrl: './greeting.css',
})
export class Greeting {
  protected readonly message = 'Hello from a generated component!';
}
```

To show it, add `Greeting` to the `imports` of the component whose template uses `<app-greeting />`.

## Go deeper

`--dry-run` (`-d`), shown above, prints exactly what a command would create without touching your files, which makes it a good habit before generating into an unfamiliar folder.

A path in the name places the files in a folder, so `features/checkout` creates `src/app/features/checkout/`. Most schematics accept more options; ask the command itself with `--help`, for example `ng generate component --help`. Under the hood these are **schematics**, and libraries can ship their own, which is how `ng add` sets a library up for you.

## Watch out

- Expecting `greeting.component.ts` after following an older guide. In Angular 20 and later the suffix is gone by default.
- Generating inside the wrong folder. Run commands from within the workspace, and use a path in the name to choose where the files go.
- Forgetting to import a generated component where you use it. The CLI creates it but does not add it to another component's `imports`.

## Remember

- `ng g c`, `ng g s`, `ng g d` and `ng g p` create components, services, directives and pipes.
- Angular 20 and later names files without a type suffix: `greeting.ts`, class `Greeting`.
- Use `--dry-run` to preview, and `--help` to see the options.
