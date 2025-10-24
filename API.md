## Overview

If it isn't clear I had ai make the documentation. I want the oceans to boil and for us all to die, trust.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Obtaining a Token

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2024-01-01T00:00:00.000Z",
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "displayName": "string",
    "roles": ["ADMIN", "TEAM"]
  }
}
```

## Error Responses

All endpoints may return the following error formats:

**400 Bad Request:**
```json
{
  "error": "Validation error message"
}
```

**401 Unauthorized:**
```json
{
  "error": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "error": "Insufficient permissions"
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "stack": "..." // Only in development mode
}
```

## Endpoints

### Authentication Endpoints

#### POST /auth/login
Login with username and password.

**Request:**
```json
{
  "username": "teamuser",
  "password": "password123"
}
```

**Response:** 200 OK
```json
{
  "token": "jwt-token",
  "expiresAt": "2024-01-02T00:00:00.000Z",
  "user": {
    "id": "user-id",
    "username": "teamuser",
    "email": "team@example.com",
    "displayName": "Team User",
    "roles": ["TEAM"]
  }
}
```

#### POST /auth/logout
Logout and invalidate current token.

**Headers:** `Authorization: Bearer <token>`

**Response:** 200 OK
```json
{
  "message": "Logged out successfully"
}
```

#### POST /auth/refresh
Refresh an existing token.

**Request:**
```json
{
  "token": "old-jwt-token"
}
```

**Response:** 200 OK
```json
{
  "token": "new-jwt-token",
  "expiresAt": "2024-01-02T00:00:00.000Z"
}
```

#### GET /auth/me
Get current authenticated user information.

**Headers:** `Authorization: Bearer <token>`

**Response:** 200 OK
```json
{
  "id": "user-id",
  "username": "teamuser",
  "email": "team@example.com",
  "displayName": "Team User",
  "status": "ACTIVE",
  "lastLogin": "2024-01-01T12:00:00.000Z",
  "roles": ["TEAM"]
}
```

### User Management Endpoints

#### GET /users
List all users (Admin only).

**Headers:** `Authorization: Bearer <token>`
**Roles Required:** ADMIN

**Response:** 200 OK
```json
[
  {
    "id": "user-id",
    "username": "user1",
    "email": "user1@example.com",
    "displayName": "User One",
    "status": "ACTIVE",
    "lastLogin": "2024-01-01T12:00:00.000Z",
    "roles": ["TEAM"],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### GET /users/:userId
Get specific user details.

**Headers:** `Authorization: Bearer <token>`
**Permissions:** Own user or Admin

**Response:** 200 OK
```json
{
  "id": "user-id",
  "username": "user1",
  "email": "user1@example.com",
  "displayName": "User One",
  "status": "ACTIVE",
  "lastLogin": "2024-01-01T12:00:00.000Z",
  "roles": ["TEAM"],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### POST /users
Create a new user (Admin only).

**Headers:** `Authorization: Bearer <token>`
**Roles Required:** ADMIN

**Request:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "securepassword",
  "displayName": "New User",
  "roles": ["TEAM"]
}
```

**Response:** 201 Created
```json
{
  "id": "new-user-id",
  "username": "newuser",
  "email": "newuser@example.com",
  "displayName": "New User",
  "roles": ["TEAM"]
}
```

#### PATCH /users/:userId
Update user information.

**Headers:** `Authorization: Bearer <token>`
**Permissions:** Own user or Admin

**Request:**
```json
{
  "email": "newemail@example.com",
  "displayName": "Updated Name",
  "status": "INACTIVE"
}
```

**Response:** 200 OK
```json
{
  "id": "user-id",
  "username": "user1",
  "email": "newemail@example.com",
  "displayName": "Updated Name",
  "status": "INACTIVE",
  "roles": ["TEAM"]
}
```

#### DELETE /users/:userId
Deactivate a user (Admin only).

**Headers:** `Authorization: Bearer <token>`
**Roles Required:** ADMIN

**Response:** 200 OK
```json
{
  "message": "User deactivated successfully"
}
```

#### POST /users/:userId/force-logout
Force logout all sessions for a user (Admin only).

**Headers:** `Authorization: Bearer <token>`
**Roles Required:** ADMIN

**Response:** 200 OK
```json
{
  "message": "User sessions terminated"
}
```

#### GET /users/:userId/sessions
List active sessions for a user.

**Headers:** `Authorization: Bearer <token>`
**Permissions:** Own user or Admin

**Response:** 200 OK
```json
[
  {
    "id": "session-id",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "expiresAt": "2024-01-02T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /users/:userId/roles
Add a role to a user (Admin only).

**Headers:** `Authorization: Bearer <token>`
**Roles Required:** ADMIN

**Request:**
```json
{
  "role": "JUDGE"
}
```

**Response:** 200 OK
```json
{
  "message": "Role added successfully"
}
```

#### DELETE /users/:userId/roles/:role
Remove a role from a user (Admin only).

**Headers:** `Authorization: Bearer <token>`
**Roles Required:** ADMIN

**Response:** 200 OK
```json
{
  "message": "Role removed successfully"
}
```

#### PATCH /users/:userId/password
Change user password.

**Headers:** `Authorization: Bearer <token>`
**Permissions:** Own user or Admin

**Request (for own password):**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

**Request (admin changing any password):**
```json
{
  "newPassword": "newpassword"
}
```

**Response:** 200 OK
```json
{
  "message": "Password changed successfully"
}
```

### Team Management Endpoints

#### GET /teams
List all teams.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `siteId` (optional): Filter by site
- `contestId` (optional): Include submission counts for specific contest

**Response:** 200 OK
```json
[
  {
    "id": "team-id",
    "name": "Team Alpha",
    "affiliation": "University XYZ",
    "institution": "Computer Science Dept",
    "siteId": "site-id",
    "status": "ACTIVE",
    "site": {
      "id": "site-id",
      "name": "Main Site"
    },
    "members": [],
    "_count": {
      "submissions": 10
    }
  }
]
```

#### GET /teams/:teamId
Get specific team details.

**Headers:** `Authorization: Bearer <token>`

**Response:** 200 OK
```json
{
  "id": "team-id",
  "name": "Team Alpha",
  "affiliation": "University XYZ",
  "institution": "Computer Science Dept",
  "siteId": "site-id",
  "contactInfo": "coach@university.edu",
  "status": "ACTIVE",
  "site": {
    "id": "site-id",
    "name": "Main Site",
    "location": "Building A"
  },
  "members": [
    {
      "id": "member-id",
      "name": "John Doe",
      "role": "Contestant",
      "user": {
        "id": "user-id",
        "username": "johndoe",
        "email": "john@example.com"
      }
    }
  ]
}
```

#### POST /teams
Create a new team (Admin only).

**Headers:** `Authorization: Bearer <token>`
**Roles Required:** ADMIN

**Request:**
```json
{
  "name": "Team Beta",
  "affiliation": "University ABC",
  "institution": "Engineering Dept",
  "siteId": "site-id",
  "contactInfo": "coach@example.com",
  "members": [
    {
      "name": "Jane Smith",
      "userId": "user-id",
      "role": "Contestant"
    }
  ]
}
```

**Response:** 201 Created
```json
{
  "id": "new-team-id",
  "name": "Team Beta",
  "affiliation": "University ABC",
  "institution": "Engineering Dept",
  "siteId": "site-id",
  "contactInfo": "coach@example.com",
  "status": "REGISTERED",
  "members": [],
  "site": null
}
```

#### PATCH /teams/:teamId
Update team information.

**Headers:** `Authorization: Bearer <token>`
**Roles Required:** ADMIN or TEAM (own team)

**Request:**
```json
{
  "name": "Team Beta Updated",
  "affiliation": "New Affiliation",
  "status": "ACTIVE"
}
```

**Response:** 200 OK
```json
{
  "id": "team-id",
  "name": "Team Beta Updated",
  "affiliation": "New Affiliation",
  "status": "ACTIVE",
  "members": [],
  "site": null
}
```

#### DELETE /teams/:teamId
Deactivate a team (Admin only).

**Headers:** `Authorization: Bearer <token>`
**Roles Required:** ADMIN

**Response:** 200 OK
```json
{
  "message": "Team deactivated successfully"
}
```

#### GET /teams/:teamId/members
List team members.

**Headers:** `Authorization: Bearer <token>`

**Response:** 200 OK
```json
[
  {
    "id": "member-id",
    "teamId": "team-id",
    "name": "John Doe",
    "role": "Contestant",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "user": {
      "id": "user-id",
      "username": "johndoe",
      "email": "john@example.com"
    }
  }
]
```

#### POST /teams/:teamId/members
Add a member to a team.

**Headers:** `Authorization: Bearer <token>`
**Roles Required:** ADMIN or TEAM (own team)

**Request:**
```json
{
  "name": "Alice Johnson",
  "userId": "user-id",
  "role": "Coach"
}
```

**Response:** 201 Created
```json
{
  "id": "new-member-id",
  "teamId": "team-id",
  "name": "Alice Johnson",
  "role": "Coach",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "user": {
    "id": "user-id",
    "username": "alicejohnson",
    "email": "alice@example.com"
  }
}
```

#### DELETE /teams/:teamId/members/:memberId
Remove a member from a team.

**Headers:** `Authorization: Bearer <token>`
**Roles Required:** ADMIN or TEAM (own team)

**Response:** 200 OK
```json
{
  "message": "Member removed successfully"
}
```

#### POST /teams/:teamId/site
Assign or change site for a team (Admin only).

**Headers:** `Authorization: Bearer <token>`
**Roles Required:** ADMIN

**Request:**
```json
{
  "siteId": "new-site-id"
}
```

**Response:** 200 OK
```json
{
  "id": "team-id",
  "name": "Team Alpha",
  "siteId": "new-site-id",
  "site": {
    "id": "new-site-id",
    "name": "Remote Site"
  }
}
```

#### GET /teams/:teamId/runs
Get all submissions for a team.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `contestId` (optional): Filter by contest

**Response:** 200 OK
```json
[
  {
    "id": "submission-id",
    "teamId": "team-id",
    "contestId": "contest-id",
    "problemId": "problem-id",
    "languageId": "language-id",
    "timestamp": "2024-01-01T10:00:00.000Z",
    "status": "ACCEPTED",
    "problem": {
      "id": "problem-id",
      "label": "A",
      "name": "Problem A"
    },
    "language": {
      "id": "language-id",
      "name": "C++"
    },
    "judgements": []
  }
]
```

#### GET /teams/:teamId/clarifications
Get all clarifications for a team.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `contestId` (optional): Filter by contest

**Response:** 200 OK
```json
[
  {
    "id": "clarification-id",
    "contestId": "contest-id",
    "teamId": "team-id",
    "questionText": "Can we use library X?",
    "answerText": "Yes, library X is allowed.",
    "timestampSubmitted": "2024-01-01T10:00:00.000Z",
    "timestampAnswered": "2024-01-01T10:05:00.000Z",
    "status": "ANSWERED",
    "isPublic": false,
    "contest": {
      "id": "contest-id",
      "name": "Contest Name"
    }
  }
]
```

#### GET /teams/:teamId/score
Get team score and ranking for a contest.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `contestId` (required): Contest ID

**Response:** 200 OK
```json
{
  "id": "score-id",
  "teamId": "team-id",
  "contestId": "contest-id",
  "problemsSolved": 3,
  "penaltyTime": 240,
  "lastCorrectTime": "2024-01-01T12:00:00.000Z",
  "rankingPosition": 5,
  "problemBreakdown": {
    "problem-a-id": {
      "attempts": 2,
      "firstCorrectTime": "2024-01-01T10:30:00.000Z",
      "penalty": 40
    },
    "problem-b-id": {
      "attempts": 1,
      "firstCorrectTime": "2024-01-01T11:00:00.000Z",
      "penalty": 60
    }
  },
  "team": {
    "id": "team-id",
    "name": "Team Alpha"
  },
  "contest": {
    "id": "contest-id",
    "name": "Contest Name"
  }
}
```

### Submission Endpoints

#### POST /contests/:contestId/submissions
Submit a solution (Team only).

**Headers:** `Authorization: Bearer <token>`
**Roles Required:** TEAM

**Request:**
```json
{
  "problemId": "problem-id",
  "languageId": "language-id",
  "sourceCode": "// Your solution code here",
  "entryPoint": "Main" // Optional, required for some languages like Java
}
```

**Response:** 201 Created
```json
{
  "id": "submission-id",
  "teamId": "team-id",
  "contestId": "contest-id",
  "problemId": "problem-id",
  "languageId": "language-id",
  "timestamp": "2024-01-01T10:30:00.000Z",
  "contestTime": 30,
  "status": "QUEUED",
  "isLate": false,
  "team": {
    "id": "team-id",
    "name": "Team Alpha"
  },
  "problem": {
    "id": "problem-id",
    "label": "A",
    "name": "Sum of Two Numbers"
  },
  "language": {
    "id": "language-id",
    "name": "C++"
  }
}
```

**Validation Rules:**
- Problem must exist in the contest
- Language must be enabled for the contest
- Contest must be in RUNNING state
- Source code must be less than 1MB
- User must be part of a team

#### GET /contests/:contestId/submissions
List submissions in a contest.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `teamId` (optional): Filter by team
- `problemId` (optional): Filter by problem
- `status` (optional): Filter by status

**Response:** 200 OK
```json
[
  {
    "id": "submission-id",
    "teamId": "team-id",
    "contestId": "contest-id",
    "problemId": "problem-id",
    "languageId": "language-id",
    "timestamp": "2024-01-01T10:30:00.000Z",
    "contestTime": 30,
    "status": "JUDGED",
    "isLate": false,
    "deleted": false,
    "team": {
      "id": "team-id",
      "name": "Team Alpha"
    },
    "problem": {
      "id": "problem-id",
      "label": "A",
      "name": "Sum of Two Numbers"
    },
    "language": {
      "id": "language-id",
      "name": "C++"
    },
    "latestJudgement": {
      "id": "judgement-id",
      "verdict": "ACCEPTED",
      "runTime": 125,
      "runMemory": 2048
    }
  }
]
```

**Permissions:**
- Teams can only see their own submissions
- Judges and Admins can see all submissions

#### GET /contests/:contestId/submissions/:submissionId
Get details of a specific submission.

**Headers:** `Authorization: Bearer <token>`

**Response:** 200 OK
```json
{
  "id": "submission-id",
  "teamId": "team-id",
  "contestId": "contest-id",
  "problemId": "problem-id",
  "languageId": "language-id",
  "timestamp": "2024-01-01T10:30:00.000Z",
  "contestTime": 30,
  "status": "JUDGED",
  "executionTime": 125,
  "memoryUsed": 2048,
  "isLate": false,
  "deleted": false,
  "team": {
    "id": "team-id",
    "name": "Team Alpha",
    "affiliation": "University XYZ"
  },
  "problem": {
    "id": "problem-id",
    "label": "A",
    "name": "Sum of Two Numbers"
  },
  "language": {
    "id": "language-id",
    "name": "C++"
  },
  "judgements": [
    {
      "id": "judgement-id",
      "verdict": "ACCEPTED",
      "runTime": 125,
      "runMemory": 2048,
      "createdAt": "2024-01-01T10:30:15.000Z"
    }
  ]
}
```

**Note:** Source code is not included in this response. Use the `/source` endpoint to retrieve it.

#### GET /contests/:contestId/submissions/:submissionId/source
Get the source code of a submission.

**Headers:** `Authorization: Bearer <token>`

**Response:** 200 OK
```json
{
  "id": "submission-id",
  "sourceCode": "#include <iostream>\nusing namespace std;\n\nint main() {\n  int a, b;\n  cin >> a >> b;\n  cout << a + b << endl;\n  return 0;\n}",
  "entryPoint": null,
  "language": {
    "name": "C++",
    "extensions": ["cpp", "cc", "cxx"]
  }
}
```

**Permissions:**
- Only team members who submitted, judges, and admins can view source code

#### GET /contests/:contestId/submissions/:submissionId/history
Get judgement history for a submission.

**Headers:** `Authorization: Bearer <token>`

**Response:** 200 OK
```json
{
  "submissionId": "submission-id",
  "judgements": [
    {
      "id": "judgement-3",
      "verdict": "ACCEPTED",
      "runTime": 125,
      "runMemory": 2048,
      "comment": null,
      "createdAt": "2024-01-01T10:32:00.000Z"
    },
    {
      "id": "judgement-2",
      "verdict": "WRONG_ANSWER",
      "runTime": 100,
      "runMemory": 2048,
      "comment": "Failed test case 3",
      "createdAt": "2024-01-01T10:31:00.000Z"
    },
    {
      "id": "judgement-1",
      "verdict": "COMPILE_ERROR",
      "runTime": null,
      "runMemory": null,
      "comment": "Missing semicolon",
      "createdAt": "2024-01-01T10:30:15.000Z"
    }
  ]
}
```

**Use Case:** View all rejudging attempts and their results

#### PATCH /contests/:contestId/submissions/:submissionId/status
Update submission status (Admin/Judge only).

**Headers:** `Authorization: Bearer <token>`
**Roles Required:** ADMIN, JUDGE

**Request:**
```json
{
  "status": "JUDGED"
}
```

**Response:** 200 OK
```json
{
  "id": "submission-id",
  "status": "JUDGED",
  "updatedAt": "2024-01-01T10:35:00.000Z"
}
```

**Valid Status Values:**
- QUEUED
- COMPILING
- RUNNING
- JUDGED
- COMPILE_ERROR
- RUNTIME_ERROR
- TIME_LIMIT
- MEMORY_LIMIT
- WRONG_ANSWER
- ACCEPTED
- ERROR
- LATE
- DELETED

### Problem Management Endpoints

#### GET /contests/:contestId/problems
List all problems in a contest.

**Headers:** `Authorization: Bearer <token>`

**Response:** 200 OK
```json
[
  {
    "id": "uuid",
    "contestId": "uuid",
    "label": "A",
    "name": "Hello World",
    "title": "Print Hello World",
    "description": "Write a program that prints 'Hello World'",
    "inputSpec": "No input",
    "outputSpec": "Single line containing 'Hello World'",
    "sampleInput": "",
    "sampleOutput": "Hello World",
    "tags": ["easy", "introduction"],
    "difficulty": 1,
    "timeLimit": 5000,
    "memoryLimit": 256,
    "testDataCount": 5,
    "specialJudge": false,
    "interactive": false,
    "active": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "_count": {
      "submissions": 42,
      "testData": 5
    }
  }
]
```

**Use Case:** Display problem list to teams, manage problems for admins

#### GET /contests/:contestId/problems/:problemId
Get details of a specific problem.

**Headers:** `Authorization: Bearer <token>`

**Response:** 200 OK
```json
{
  "id": "uuid",
  "contestId": "uuid",
  "label": "A",
  "name": "Hello World",
  "title": "Print Hello World",
  "description": "Write a program that prints 'Hello World'",
  "inputSpec": "No input",
  "outputSpec": "Single line containing 'Hello World'",
  "sampleInput": "",
  "sampleOutput": "Hello World",
  "tags": ["easy", "introduction"],
  "difficulty": 1,
  "timeLimit": 5000,
  "memoryLimit": 256,
  "testDataCount": 5,
  "specialJudge": false,
  "interactive": false,
  "archiveLocation": null,
  "active": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "contest": {
    "id": "uuid",
    "name": "Sample Contest"
  },
  "testData": [
    {
      "id": "uuid",
      "order": 1,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "_count": {
    "submissions": 42
  }
}
```

**Use Case:** View problem details, check test data count

#### POST /contests/:contestId/problems
Create a new problem (Admin only).

**Headers:** `Authorization: Bearer <token>`
**Roles Required:** ADMIN

**Request:**
```json
{
  "label": "B",
  "name": "Sum of Two Numbers",
  "title": "Calculate A + B",
  "description": "Given two integers A and B, calculate their sum",
  "inputSpec": "Two integers A and B (-10^9 <= A, B <= 10^9)",
  "outputSpec": "Single integer representing A + B",
  "sampleInput": "5 7",
  "sampleOutput": "12",
  "tags": ["easy", "math"],
  "difficulty": 2,
  "timeLimit": 1000,
  "memoryLimit": 128,
  "specialJudge": false,
  "interactive": false,
  "active": true
}
```

**Response:** 201 Created
```json
{
  "id": "uuid",
  "contestId": "uuid",
  "label": "B",
  "name": "Sum of Two Numbers",
  "title": "Calculate A + B",
  "description": "Given two integers A and B, calculate their sum",
  "inputSpec": "Two integers A and B (-10^9 <= A, B <= 10^9)",
  "outputSpec": "Single integer representing A + B",
  "sampleInput": "5 7",
  "sampleOutput": "12",
  "tags": ["easy", "math"],
  "difficulty": 2,
  "timeLimit": 1000,
  "memoryLimit": 128,
  "testDataCount": 0,
  "specialJudge": false,
  "interactive": false,
  "archiveLocation": null,
  "active": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "contest": {
    "id": "uuid",
    "name": "Sample Contest"
  }
}
```

**Validations:**
- `label` and `name` are required
- `label` must be unique within the contest
- Default `timeLimit`: 5000ms
- Default `memoryLimit`: 256MB
- Default `active`: true

**Events Published:**
- `PROBLEM_ADDED` event to contest event feed

**Audit Log:** Creates audit log entry with action `CREATE_PROBLEM`

**Use Case:** Add new problems to contest

#### PATCH /contests/:contestId/problems/:problemId
Update an existing problem (Admin only).

**Headers:** `Authorization: Bearer <token>`
**Roles Required:** ADMIN

**Request (all fields optional):**
```json
{
  "label": "C",
  "name": "Updated Problem Name",
  "title": "Updated Title",
  "description": "Updated description",
  "timeLimit": 2000,
  "memoryLimit": 512,
  "active": false,
  "tags": ["updated", "tag"]
}
```

**Response:** 200 OK
```json
{
  "id": "uuid",
  "contestId": "uuid",
  "label": "C",
  "name": "Updated Problem Name",
  "title": "Updated Title",
  "description": "Updated description",
  "timeLimit": 2000,
  "memoryLimit": 512,
  "active": false,
  "tags": ["updated", "tag"],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T01:00:00.000Z",
  "contest": {
    "id": "uuid",
    "name": "Sample Contest"
  }
}
```

**Validations:**
- Problem must exist in the specified contest
- If `label` is changed, new label must be unique in contest

**Audit Log:** Creates audit log entry with action `UPDATE_PROBLEM` and changes tracked

**Use Case:** Update problem details, activate/deactivate problems

#### DELETE /contests/:contestId/problems/:problemId
Deactivate a problem (Admin only). Performs soft delete by setting active=false.

**Headers:** `Authorization: Bearer <token>`
**Roles Required:** ADMIN

**Response:** 200 OK
```json
{
  "message": "Problem deactivated successfully"
}
```

**Audit Log:** Creates audit log entry with action `DELETE_PROBLEM`

**Use Case:** Remove problem from contest without deleting submissions

#### GET /contests/:contestId/problems/:problemId/testdata
List test data for a problem (Admin/Judge only).

**Headers:** `Authorization: Bearer <token>`
**Roles Required:** ADMIN, JUDGE

**Response:** 200 OK
```json
[
  {
    "id": "uuid",
    "problemId": "uuid",
    "inputFile": "/path/to/input1.txt",
    "outputFile": "/path/to/output1.txt",
    "order": 1,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": "uuid",
    "problemId": "uuid",
    "inputFile": "/path/to/input2.txt",
    "outputFile": "/path/to/output2.txt",
    "order": 2,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Use Case:** View test cases for problem validation

#### POST /contests/:contestId/problems/:problemId/testdata
Upload test data for a problem (Admin only).

**Headers:** `Authorization: Bearer <token>`
**Roles Required:** ADMIN

**Request:**
```json
{
  "inputFile": "/path/to/input.txt",
  "outputFile": "/path/to/output.txt",
  "order": 3
}
```

**Response:** 201 Created
```json
{
  "id": "uuid",
  "problemId": "uuid",
  "inputFile": "/path/to/input.txt",
  "outputFile": "/path/to/output.txt",
  "order": 3,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Behavior:**
- Auto-increments `order` if not provided
- Increments problem's `testDataCount`

**Audit Log:** Creates audit log entry with action `UPLOAD_TEST_DATA`

**Use Case:** Add test cases to problem

#### DELETE /contests/:contestId/problems/:problemId/testdata/:testDataId
Delete test data (Admin only).

**Headers:** `Authorization: Bearer <token>`
**Roles Required:** ADMIN

**Response:** 200 OK
```json
{
  "message": "Test data deleted successfully"
}
```

**Behavior:**
- Decrements problem's `testDataCount`

**Audit Log:** Creates audit log entry with action `DELETE_TEST_DATA`

**Use Case:** Remove invalid or outdated test cases

### Judgement & Judging Endpoints

#### POST /contests/:contestId/submissions/:submissionId/judgements
Create a new judgement for a submission (Judge/Admin only).

**Headers:** `Authorization: Bearer <token>`
**Roles Required:** JUDGE, ADMIN

**Request:**
```json
{
  "verdict": "ACCEPTED",
  "testCase": 5,
  "runTime": 125,
  "runMemory": 2048,
  "comment": "All test cases passed"
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "data": {
    "id": "judgement-id",
    "submissionId": "submission-id",
    "verdict": "ACCEPTED",
    "testCase": 5,
    "runTime": 125,
    "runMemory": 2048,
    "comment": "All test cases passed",
    "startTime": "2024-01-01T10:30:15.000Z",
    "endTime": "2024-01-01T10:30:20.000Z",
    "createdAt": "2024-01-01T10:30:20.000Z"
  }
}
```

**Verdict Values:**
- ACCEPTED
- WRONG_ANSWER
- TIME_LIMIT_EXCEEDED
- MEMORY_LIMIT_EXCEEDED
- RUNTIME_ERROR
- COMPILATION_ERROR
- PRESENTATION_ERROR
- OUTPUT_LIMIT_EXCEEDED
- INTERNAL_ERROR

#### GET /contests/:contestId/judgements
List all judgements in a contest.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `submissionId` (optional): Filter by submission
- `verdict` (optional): Filter by verdict
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 50): Results per page

**Response:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "id": "judgement-id",
      "submissionId": "submission-id",
      "verdict": "ACCEPTED",
      "testCase": null,
      "runTime": 125,
      "runMemory": 2048,
      "comment": null,
      "createdAt": "2024-01-01T10:30:20.000Z",
      "submission": {
        "id": "submission-id",
        "contestTime": 30,
        "teamId": "team-id",
        "problemId": "problem-id",
        "team": {
          "name": "Team Alpha"
        },
        "problem": {
          "label": "A",
          "name": "Sum of Two Numbers"
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

**Permissions:**
- Teams can only see judgements for their own submissions
- Judges and Admins can see all judgements

#### GET /contests/:contestId/judgements/:judgementId
Get details of a specific judgement.

**Headers:** `Authorization: Bearer <token>`

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "id": "judgement-id",
    "submissionId": "submission-id",
    "verdict": "ACCEPTED",
    "testCase": null,
    "runTime": 125,
    "runMemory": 2048,
    "comment": "All test cases passed",
    "startTime": "2024-01-01T10:30:15.000Z",
    "endTime": "2024-01-01T10:30:20.000Z",
    "createdAt": "2024-01-01T10:30:20.000Z",
    "submission": {
      "id": "submission-id",
      "contestTime": 30,
      "teamId": "team-id",
      "problemId": "problem-id",
      "team": {
        "id": "team-id",
        "name": "Team Alpha"
      },
      "problem": {
        "id": "problem-id",
        "label": "A",
        "name": "Sum of Two Numbers"
      },
      "language": {
        "id": "language-id",
        "name": "C++"
      }
    }
  }
}
```

#### POST /contests/:contestId/submissions/:submissionId/rejudge
Rejudge a submission (Judge/Admin only).

**Headers:** `Authorization: Bearer <token>`
**Roles Required:** JUDGE, ADMIN

**Request:**
```json
{
  "reason": "Test data updated"
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Submission queued for rejudging",
  "data": {
    "submissionId": "submission-id",
    "status": "QUEUED"
  }
}
```

**Use Cases:**
- Test data was updated after initial judgement
- Judging error detected
- Manual review required

#### POST /contests/:contestId/submissions/:submissionId/execute
Execute test cases for a submission (Judge/Admin only).

**Headers:** `Authorization: Bearer <token>`
**Roles Required:** JUDGE, ADMIN

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "judgement": {
      "id": "judgement-id",
      "submissionId": "submission-id",
      "verdict": "ACCEPTED",
      "runTime": 425,
      "runMemory": 4096,
      "endTime": "2024-01-01T10:30:25.000Z",
      "createdAt": "2024-01-01T10:30:25.000Z"
    },
    "results": [
      {
        "testCase": 1,
        "verdict": "ACCEPTED",
        "time": 100,
        "memory": 2048
      },
      {
        "testCase": 2,
        "verdict": "ACCEPTED",
        "time": 125,
        "memory": 2048
      },
      {
        "testCase": 3,
        "verdict": "ACCEPTED",
        "time": 200,
        "memory": 4096
      }
    ],
    "summary": {
      "totalTests": 3,
      "passed": 3,
      "totalTime": 425,
      "maxMemory": 4096
    }
  }
}
```

**Process:**
1. Updates submission status to RUNNING
2. Executes code against all test cases
3. Stops on first failure (or continues based on config)
4. Creates judgement records
5. Updates submission with final verdict
6. Publishes judgement event

#### POST /contests/:contestId/submissions/:submissionId/compile
Compile source code (Judge/Admin only).

**Headers:** `Authorization: Bearer <token>`
**Roles Required:** JUDGE, ADMIN

**Response:** 200 OK (Success)
```json
{
  "success": true,
  "message": "Compilation successful",
  "data": {
    "submissionId": "submission-id",
    "status": "QUEUED"
  }
}
```

**Response:** 200 OK (Failure)
```json
{
  "success": false,
  "message": "Compilation failed",
  "data": {
    "error": "main.cpp:10:5: error: expected ';' before '}' token"
  }
}
```

**Process:**
1. Updates submission status to COMPILING
2. Attempts to compile using language compiler command
3. On success: sets status to QUEUED for execution
4. On failure: creates COMPILATION_ERROR judgement with error details

#### GET /contests/:contestId/judgements/stats
Get judgement statistics for a contest.

**Headers:** `Authorization: Bearer <token>`

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "total": 450,
    "byVerdict": {
      "ACCEPTED": 280,
      "WRONG_ANSWER": 95,
      "TIME_LIMIT_EXCEEDED": 35,
      "RUNTIME_ERROR": 25,
      "COMPILATION_ERROR": 15
    }
  }
}
```

**Use Case:** Dashboard statistics, contest analysis

#### GET /contests/:contestId/judgements/queue
Get execution queue status (Judge/Admin only).

**Headers:** `Authorization: Bearer <token>`
**Roles Required:** JUDGE, ADMIN

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "total": 45,
    "breakdown": {
      "QUEUED": 30,
      "COMPILING": 8,
      "RUNNING": 7
    }
  }
}
```

**Use Case:** Monitor judge system load and queue depth

---

### 8.8. Get Scoreboard

**Endpoint:** `GET /api/scoreboard/:contestId`

**Authentication:** Required (All roles)

**Description:** Get current scoreboard with customizable scoring configuration

**Query Parameters:**
- `config` (optional): JSON string with custom scoring configuration
- `includeDetails` (optional): `true` (default) or `false` - include per-problem details

**Scoring Configuration Options:**
```json
{
  "scoringMethod": "per_problem" | "per_testcase",
  "penaltyPerWrongAttempt": 20,
  "penaltyAppliesWhen": "before_accept" | "all_attempts" | "never",
  "tiebreakers": ["problems_solved", "penalty_time", "last_accept_time", "first_accept_time", "total_attempts", "team_name"],
  "problemScoring": {
    "pointsPerProblem": 100,
    "partialCredit": true,
    "testcaseWeights": { "0": 10, "1": 20, "2": 30 }
  },
  "countOnlyAccepted": false,
  "firstSubmissionBonus": 0,
  "freezeScoreboard": true
}
```

**Response:**
```json
{
  "contestId": "uuid",
  "contestName": "ICPC World Finals 2024",
  "frozen": false,
  "freezeTime": "2024-01-01T14:00:00.000Z",
  "thawTime": null,
  "scoringConfig": {
    "scoringMethod": "per_problem",
    "penaltyPerWrongAttempt": 20,
    "penaltyAppliesWhen": "before_accept",
    "tiebreakers": ["problems_solved", "penalty_time", "last_accept_time"],
    "problemScoring": {
      "partialCredit": false
    },
    "countOnlyAccepted": false,
    "freezeScoreboard": true
  },
  "lastUpdated": "2024-01-01T15:30:00.000Z",
  "teams": [
    {
      "teamId": "uuid",
      "teamName": "Team Alpha",
      "affiliation": "MIT",
      "problemsSolved": 8,
      "totalScore": 8,
      "penaltyTime": 742,
      "lastAcceptTime": "2024-01-01T14:32:15.000Z",
      "firstAcceptTime": "2024-01-01T10:15:00.000Z",
      "totalAttempts": 15,
      "rank": 1,
      "problems": {
        "problem-id-1": {
          "attempts": 1,
          "solved": true,
          "score": 1,
          "penalty": 45,
          "firstAcceptTime": "2024-01-01T10:45:00.000Z",
          "submissionCount": 1,
          "testcasesPassed": null,
          "totalTestcases": 10
        }
      }
    }
  ]
}
```

**Example (ACM-style):**
```bash
curl http://localhost:3000/api/scoreboard/contest-id \
  -H "Authorization: Bearer <token>"
```

**Example (IOI-style with partial credit):**
```bash
curl "http://localhost:3000/api/scoreboard/contest-id?config=%7B%22scoringMethod%22%3A%22per_testcase%22%2C%22problemScoring%22%3A%7B%22pointsPerProblem%22%3A100%2C%22partialCredit%22%3Atrue%7D%7D" \
  -H "Authorization: Bearer <token>"
```

**Use Case:** Display real-time contest standings with flexible scoring rules

---

### 8.9. Get Frozen Scoreboard

**Endpoint:** `GET /api/scoreboard/:contestId/frozen`

**Authentication:** Required (All roles)

**Description:** Get frozen scoreboard view (hides submissions after freeze time)

**Response:** Same as Get Scoreboard with `frozen: true`

**Example:**
```bash
curl http://localhost:3000/api/scoreboard/contest-id/frozen \
  -H "Authorization: Bearer <token>"
```

**Use Case:** Display scoreboard during freeze period without revealing recent submissions

---

### 8.10. Get Team Scoreboard

**Endpoint:** `GET /api/scoreboard/:contestId/team/:teamId`

**Authentication:** Required (All roles)

**Description:** Get scoreboard entry for a specific team

**Response:**
```json
{
  "contestId": "uuid",
  "team": {
    "teamId": "uuid",
    "teamName": "Team Alpha",
    "affiliation": "MIT",
    "problemsSolved": 8,
    "totalScore": 8,
    "penaltyTime": 742,
    "rank": 1,
    "problems": {
      "problem-id-1": {
        "attempts": 1,
        "solved": true,
        "score": 1,
        "penalty": 45,
        "firstAcceptTime": "2024-01-01T10:45:00.000Z"
      }
    }
  }
}
```

**Example:**
```bash
curl http://localhost:3000/api/scoreboard/contest-id/team/team-id \
  -H "Authorization: Bearer <token>"
```

**Use Case:** Show team their own standing and problem-by-problem breakdown

---

### 8.11. Update Scoreboard

**Endpoint:** `POST /api/scoreboard/:contestId/update`

**Authentication:** Required (Admin/Judge only)

**Description:** Recalculate and update scores in database

**Response:**
```json
{
  "message": "Scoreboard updated successfully",
  "teamsUpdated": 42
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/scoreboard/contest-id/update \
  -H "Authorization: Bearer <token>"
```

**Use Case:** Force scoreboard recalculation after manual judging changes

---

### 8.12. Get Scoreboard Statistics

**Endpoint:** `GET /api/scoreboard/:contestId/stats`

**Authentication:** Required (All roles)

**Description:** Get contest-wide statistics and per-problem metrics

**Response:**
```json
{
  "totalTeams": 150,
  "totalSubmissions": 1247,
  "totalProblems": 12,
  "problemStats": {
    "A": {
      "problemId": "uuid",
      "label": "A",
      "name": "Hello World",
      "totalSubmissions": 142,
      "acceptedSubmissions": 128,
      "acceptanceRate": "90.14%",
      "uniqueSolvers": 125,
      "firstSolver": {
        "name": "Team Flash"
      }
    },
    "B": {
      "problemId": "uuid",
      "label": "B",
      "name": "Graph Theory",
      "totalSubmissions": 89,
      "acceptedSubmissions": 23,
      "acceptanceRate": "25.84%",
      "uniqueSolvers": 22,
      "firstSolver": {
        "name": "Team Alpha"
      }
    }
  }
}
```

**Example:**
```bash
curl http://localhost:3000/api/scoreboard/contest-id/stats \
  -H "Authorization: Bearer <token>"
```

**Use Case:** Display problem difficulty and solving statistics

---

### 8.13. Export Scoreboard HTML

**Endpoint:** `GET /api/scoreboard/:contestId/export/html`

**Authentication:** Required (All roles)

**Description:** Export scoreboard as standalone HTML file

**Response:** HTML file download

**Example:**
```bash
curl http://localhost:3000/api/scoreboard/contest-id/export/html \
  -H "Authorization: Bearer <token>" \
  -o scoreboard.html
```

**Use Case:** Generate printable/shareable scoreboard for display or archival

---

## Data Models

### User Roles
- `ADMIN`: System administrator with full access
- `JUDGE`: Contest judge with judging permissions
- `TEAM`: Team member with submission permissions
- `SCOREBOARD_VIEWER`: Read-only access to scoreboards
- `GUEST`: Limited read-only access

### User Status
- `ACTIVE`: Active and can login
- `INACTIVE`: Deactivated, cannot login
- `SUSPENDED`: Temporarily suspended

### Team Status
- `REGISTERED`: Team is registered but not yet active
- `ACTIVE`: Team is active and can compete
- `DISQUALIFIED`: Team has been disqualified
- `INACTIVE`: Team is deactivated

### Contest Status
- `NOT_STARTED`: Contest has not begun
- `RUNNING`: Contest is in progress
- `PAUSED`: Contest is temporarily paused
- `ENDED`: Contest has ended
- `FINALIZED`: Contest results are finalized

### Submission Status
- `QUEUED`: Waiting to be judged
- `COMPILING`: Being compiled
- `RUNNING`: Running against test cases
- `JUDGED`: Judging complete
- `COMPILE_ERROR`: Compilation failed
- `RUNTIME_ERROR`: Runtime error occurred
- `TIME_LIMIT`: Time limit exceeded
- `MEMORY_LIMIT`: Memory limit exceeded
- `WRONG_ANSWER`: Incorrect output
- `ACCEPTED`: Solution accepted
- `ERROR`: Judging error
- `LATE`: Submitted after deadline
- `DELETED`: Marked as deleted

### Verdict Types
- `ACCEPTED`: Solution is correct
- `WRONG_ANSWER`: Incorrect output
- `TIME_LIMIT_EXCEEDED`: Exceeded time limit
- `MEMORY_LIMIT_EXCEEDED`: Exceeded memory limit
- `RUNTIME_ERROR`: Program crashed
- `COMPILATION_ERROR`: Failed to compile
- `PRESENTATION_ERROR`: Output format issue
- `OUTPUT_LIMIT_EXCEEDED`: Too much output
- `SECURITY_VIOLATION`: Security issue detected
- `JUDGING_ERROR`: Error in judging system
- `PENDING`: Waiting for judgement

## Rate Limiting

API endpoints are rate-limited to prevent abuse. Default limits:
- Authentication endpoints: 5 requests per minute
- General API: 100 requests per minute
- Submission endpoints: 10 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## Webhooks

Webhooks can be registered to receive real-time notifications of events.

### Event Types
- `SUBMISSION`: New submission received
- `JUDGEMENT`: Judgement completed
- `CLARIFICATION`: New clarification submitted
- `SCOREBOARD_UPDATE`: Scoreboard changed
- `SITE_CONNECTED`: Site connected
- `SITE_DISCONNECTED`: Site disconnected
- `CONTEST_STARTED`: Contest started
- `CONTEST_PAUSED`: Contest paused
- `CONTEST_RESUMED`: Contest resumed
- `CONTEST_ENDED`: Contest ended
- `CONTEST_FINALIZED`: Contest finalized
- `PROBLEM_ADDED`: Problem added to contest
- `TEAM_REGISTERED`: Team registered

### Webhook Payload Format
```json
{
  "event": "SUBMISSION",
  "timestamp": "2024-01-01T10:00:00.000Z",
  "data": {
    "id": "submission-id",
    "teamId": "team-id",
    "problemId": "problem-id",
    "status": "QUEUED"
  }
}
```

## Pagination

List endpoints support pagination using query parameters:
- `page`: Page number (default: 1)
- `perPage`: Items per page (default: 30, max: 100)

Response includes pagination metadata:
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "perPage": 30,
    "total": 100,
    "totalPages": 4
  }
}
```

## Filtering & Sorting

Many list endpoints support filtering and sorting via query parameters:
- `sortBy`: Field to sort by
- `sortOrder`: `asc` or `desc`
- Custom filters: endpoint-specific

Example:
```
GET /api/teams?siteId=site-123&sortBy=name&sortOrder=asc
```

## WebSocket Support (Future)

Real-time updates will be available via WebSocket connections:
```javascript
const ws = new WebSocket('ws://localhost:3000/ws');
ws.on('message', (data) => {
  const event = JSON.parse(data);
  console.log('Event:', event);
});
```

## Examples

### Creating a Complete Contest Workflow

1. **Create a contest:**
```bash
POST /api/contests
{
  "name": "Spring Programming Contest 2024",
  "startTime": "2024-03-15T09:00:00Z",
  "duration": 300,
  "contestType": "ICPC",
  "scoringModel": "ACM"
}
```

2. **Add problems:**
```bash
POST /api/problems
{
  "contestId": "contest-id",
  "label": "A",
  "name": "Sum of Two Numbers",
  "timeLimit": 1000,
  "memoryLimit": 256
}
```

3. **Register teams:**
```bash
POST /api/teams
{
  "name": "Team Alpha",
  "affiliation": "University XYZ"
}
```

4. **Start contest:**
```bash
POST /api/contests/contest-id/start
```

5. **Teams submit solutions:**
```bash
POST /api/submissions
{
  "contestId": "contest-id",
  "problemId": "problem-id",
  "languageId": "language-id",
  "sourceCode": "..."
}
```

6. **View scoreboard:**
```bash
GET /api/scoreboard/contest-id
```

7. **End and finalize contest:**
```bash
POST /api/contests/contest-id/end
POST /api/contests/contest-id/finalize
```

## Support

For API support and questions:
- Open an issue on GitHub
- Contact: support@example.com
