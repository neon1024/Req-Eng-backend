Feature: User Authentication
  As a user of the healthcare system
  I want to authenticate using my credentials
  So that I can access the system securely

  Background:
    Given the API server is running
    And the following users exist in the system:
      | email              | password   | name           | role    |
      | doctor@example.com | doctor123  | Dr. John Smith | doctor  |
      | patient@example.com| patient123 | Jane Doe       | patient |

  Scenario: Successful login as a doctor
    When I send a POST request to "/api/auth/login" with:
      | email              | password  |
      | doctor@example.com | doctor123 |
    Then the response status should be 200
    And the response should contain a "token"
    And the response user role should be "doctor"

  Scenario: Successful login as a patient
    When I send a POST request to "/api/auth/login" with:
      | email               | password   |
      | patient@example.com | patient123 |
    Then the response status should be 200
    And the response should contain a "token"
    And the response user role should be "patient"

  Scenario: Failed login with wrong password
    When I send a POST request to "/api/auth/login" with:
      | email              | password      |
      | doctor@example.com | wrongpassword |
    Then the response status should be 401
    And the response message should be "Invalid credentials"

  Scenario: Failed login with non-existent email
    When I send a POST request to "/api/auth/login" with:
      | email                 | password |
      | unknown@example.com   | test123  |
    Then the response status should be 401
    And the response message should be "Invalid credentials"

  Scenario: Login with missing email
    When I send a POST request to "/api/auth/login" with:
      | password  |
      | doctor123 |
    Then the response status should be 400
    And the response message should be "Email and password are required"

  Scenario: Login with missing password
    When I send a POST request to "/api/auth/login" with:
      | email              |
      | doctor@example.com |
    Then the response status should be 400
    And the response message should be "Email and password are required"
