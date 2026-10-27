# User stories

Every user-facing change to FIT50 starts here. A story file is the
contract; the code is the implementation of the contract.

- **Read** the closest existing story before writing a new one.
- **Draft** a story, get it approved, *then* build.
- **Update** the index when the build ships.

See the `user-stories-first` skill for the enforced workflow.

## User types

The canonical list lives in [TEMPLATE.md](./TEMPLATE.md).

| User type | One-line description |
|---|---|
| **Challenger** | Signed in, working through the 50-day challenge, logging food and habits daily. The core audience. |
| **Premium challenger** | A challenger who has paid for premium (cloud sync, streak protection, reminders, photo proof, certificate, data export). |
| **Free challenger** | A signed-in challenger on the free tier. |
| **Visitor** | Not signed in. Sees the marketing site only. |

## Index

| Feature | User types | Story | Shipped | Notes |
|---|---|---|---|---|
| Speak your food into the tracker | Challenger, Free challenger | [voice-food-capture](./voice-food-capture.md) | yes | Voice capture in the "Add custom food" modal. Replaces the photo scan as the primary path; photo scanning stays as a secondary option. No new API route — reuses `/api/foods/custom/extract`. |
