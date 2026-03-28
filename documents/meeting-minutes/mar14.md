Time: 3:30-5:00 pm

## Agenda

### Backend Architecture — Repository Pattern
- Define the structure for data access to decouple business logic from the database.
- Planning the `DefinitionRepository` and `UserRepository`.

## Notes

### Repository Layer Implementation
- **DefinitionRepository** will handle CRUD for courses and definitions, including contributor tracking logic.
- **UserRepository** will handle account details and role management.
- Agreed to use Mongoose `.lean()` where possible to optimize performance for read-heavy operations.
- Next steps: Initial integration tests for the repository layer using `node:test` and `supertest`.
