Feature: User Authorization
  As an authenticated user
  I want to access protected resources
  So that I can use the system features based on my role

  Background:
    Given the API server is running
    And the following users exist in the system:
      | email              | password   | name           | role    |
      | doctor@example.com | doctor123  | Dr. John Smith | doctor  |
      | patient@example.com| patient123 | Jane Doe       | patient |

  Scenario: Access profile with valid token
    Given I am logged in as "doctor@example.com" with password "doctor123"
    When I send a GET request to "/api/auth/profile" with authentication
    Then the response status should be 200
    And the response should contain user information

  Scenario: Access profile without token
    When I send a GET request to "/api/auth/profile" without authentication
    Then the response status should be 401
    And the response message should be "No token provided"

  Scenario: Access profile with invalid token
    Given I have an invalid token
    When I send a GET request to "/api/auth/profile" with authentication
    Then the response status should be 401
    And the response message should be "Invalid token"

  Scenario: Health check endpoint is publicly accessible
    When I send a GET request to "/api/health"
    Then the response status should be 200
    And the response should contain "status" with value "ok"
