# Project Best Practices

This document outlines a few principles and conventions to help keep the project maintainable as it grows.  Following these guidelines will make it easier to extend the codebase and collaborate with others.

## Code organization

* **Separation of concerns** – Keep geocoding, Overpass queries, API handlers and UI components in separate modules.  Each module should do one thing well.
* **DRY (Don't Repeat Yourself)** – Avoid duplicating code.  If you find yourself copying a function, move it into a shared module and import it.
* **SOLID principles** – Where applicable, apply SOLID concepts:
  * **Single responsibility** – A module or class should have only one reason to change.  For example, `osmService.ts` is responsible solely for talking to OSM.
  * **Open/closed** – Code should be open for extension but closed for modification.  When adding new search strategies (e.g. street‑based adjacency), add new functions instead of rewriting existing ones.
  * **Liskov substitution** – If you define interfaces, ensure implementations can be used interchangeably without breaking consumers.
  * **Interface segregation** – Keep interfaces small and focused rather than having one large interface.
  * **Dependency inversion** – Depend on abstractions rather than concrete classes.  Use dependency injection where appropriate, especially in the HTTP layer (not yet implemented).

## Testing guidelines

* **End‑to‑end over mocks** – Wherever possible, tests should call the real external APIs.  Mocks can hide integration issues and drift from reality.  The provided tests exercise real calls to Nominatim and Overpass.
* **Generous timeouts** – Network conditions vary.  Use `jest.setTimeout` to extend the default 5‑second timeout when calling remote services.
* **Stable inputs** – Choose test addresses that are unlikely to disappear from OSM.  Major streets or landmarks are safer than small businesses.
* **Small network footprint** – Group API calls within tests and avoid unnecessary requests to respect OSM’s usage policies.

## Continuous Integration

* A GitHub Actions workflow is included to run the test suite on every push and pull request.  Make sure that the CI stays green before merging changes.
* Tests that depend on external services may occasionally fail due to transient network issues.  If a failure is caused by external factors rather than code changes, rerun the CI or adjust the tests.

## Contribution workflow

1. **Branch off `main`** – Create a new branch for each feature or bug fix.  Do not commit directly to `main`.
2. **Write tests** – Before implementing a new feature, write tests that describe the expected behaviour.  This practice helps avoid regressions.
3. **Submit a pull request** – Open a pull request and let the CI run.  Address any comments and ensure all tests pass.
4. **Merge only when green** – Merge the pull request only after the CI pipeline is green.  If new features require updates to existing tests, adjust them thoughtfully.

By adhering to these practices, we aim to build a reliable and maintainable codebase that can evolve to support additional data sources and interfaces.