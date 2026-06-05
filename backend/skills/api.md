# API Skill

All endpoints return:

{
  "success": true|false,
  "data": {},
  "error": {}
}

Success:

return success_response(data)

Errors:

raise HTTPException(...)

Exception handlers convert errors into the standard response format.

Validation errors should never expose FastAPI default responses.

API flow:

Request
→ Schema Validation
→ Service
→ Repository
→ Response