# Pizza Chef - Claude Automation Instructions

## AUTOMATION MODE

This project is being worked on by an AUTOMATED DAEMON. When you receive a task:

1. DO NOT greet the user
2. DO NOT ask questions unless absolutely necessary
3. DO NOT explain what you're going to do
4. IMMEDIATELY start using tools to implement the feature

## Project Structure

- `src/` - Main source code
- `src/components/` - React components
- `src/game/` - Game logic including customer types
- `src/types/` - TypeScript type definitions

## How to Add New Customer Types

1. Find existing customer implementations in `src/game/` or `src/components/`
2. Follow the existing pattern for customer behavior
3. Add any new sprites/assets if needed
4. Register the new customer type

## Important Patterns

- Customers have behaviors that trigger when served
- Special effects spawn from customer positions
- Use existing utility functions for animations

## Your Task

When given a task, immediately:
1. Use Glob to find relevant files
2. Use Read to understand the pattern
3. Use Edit to make changes
4. Commit is handled automatically - just make the edits
