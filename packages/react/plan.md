# @siheom/react — coverage behaviors

Intentional gaps (not line fillers). Target: statements ≥ 90%.

## Behaviors

- [x] `cleanupReactRoots` unmounts roots mounted by `given.render` and removes their containers
- [x] `effect.runAllTimers` drains remaining fake timers so deferred UI updates settle
- [x] `createReactSiheom({ user })` runs actions with the injected user (e.g. `vitest/browser` `userEvent` for trusted input)
