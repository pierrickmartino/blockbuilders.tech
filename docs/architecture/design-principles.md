# Design Principles

## KISS - Keep It Simple, Stupid
- Simplicity should be a key goal design
- Choose straightforward solutions over complex ones whenever possible
- Simple solutions are easier to understand, maintain, and debug

## DRY - Don’t Repeat Yourself
- Every piece of knowledge should have a single, unambiguous representation in the system
- Avoid duplicating logic, code, or configuration
- Centralize shared functionality so that changes only need to be made once

## YAGNI - You Aren’t Gonna Need It
- Avoid building functionality on speculation
- Implement features only when they are needed, not when you anticipate they might be useful in the future

## TDA - Tell, Don’t Ask
- Objects should be told what to do, not interrogated for state to decide externally
- Encourages encapsulation and reduces coupling
- Leads to more expressive, maintainable, and object-oriented code

## Design Principles
- **Dependency Inversion**: High-level modules should not depend on low-level modules. Both should depend on abstractions.
- **Open/Closed Principle**: Software entities should be open for extension but closed for modification.
- **Vertical Slice Architecture**: Organize by features, not layers
- **Component-First**: Build with reusable, composable components with single responsibility
- **Fail Fast**: Validate inputs early, throw errors immediately
