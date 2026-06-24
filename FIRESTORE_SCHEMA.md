# Firestore Schema for Huishoudboekje

## Collections

### users
- `uid` (document ID)
- `displayName`: string
- `email`: string
- `createdAt`: timestamp

Used for authenticated users and owner relationships.

### householdBooks
- `id` (document ID)
- `name`: string
- `description`: string
- `ownerId`: string (uid)
- `memberIds`: array<string> (user uids)
- `archived`: boolean
- `createdAt`: timestamp
- `updatedAt`: timestamp

A household book is the top-level project in the app. Only the owner and members can read it.

### categories
- `id` (document ID)
- `householdBookId`: string
- `name`: string
- `budget`: number
- `color`: string (optional)
- `createdAt`: timestamp
- `updatedAt`: timestamp

Categories are tied to a household book and used for budgeting and expense grouping.

### transactions
- `id` (document ID)
- `householdBookId`: string
- `categoryId`: string (nullable)
- `userId`: string
- `description`: string
- `amount`: number
- `date`: timestamp
- `type`: string (`expense` or `income`)
- `archived`: boolean (optional)
- `createdAt`: timestamp
- `updatedAt`: timestamp

Transactions belong to a household book and may be linked to one category.

## Access patterns

- Fetch all active household books for the current user.
- Fetch archived household books separately.
- Fetch transactions by household book and by month.
- Fetch categories by household book.
- Query budget status and spend per category.

## Index recommendations

- `householdBooks` by `ownerId`, `archived`
- `transactions` by `householdBookId`, `date`
- `categories` by `householdBookId`
