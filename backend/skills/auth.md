# Authentication Skill

Authentication uses JWT.

Rules:

- Email is the login identifier.
- Passwords must be hashed.
- Plain text passwords are never stored.
- Authentication returns JWT access token.
- Inactive users cannot log in.

Registration Flow

Validate Input
→ Check Existing User
→ Hash Password
→ Create User
→ Generate JWT
→ Return User + Token

Login Flow

Validate Input
→ Find User
→ Verify Password
→ Verify Active Status
→ Generate JWT
→ Return User + Token