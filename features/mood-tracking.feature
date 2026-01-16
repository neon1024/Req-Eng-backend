Feature: Mood Tracking
  As a patient
  I want to track my daily mood
  So that I can monitor my mental health over time

  Background:
    Given the API server is running
    And the following users exist in the system:
      | email               | password   | name           | role    |
      | doctor@example.com  | doctor123  | Dr. John Smith | doctor  |
      | patient@example.com | patient123 | Jane Doe       | patient |

  # Public endpoint tests
  Scenario: Get mood configuration without authentication
    When I send a GET request to "/api/moods/config"
    Then the response status should be 200
    And the response should contain mood rate configuration

  # Add mood scenarios
  Scenario: Patient adds mood for today
    Given I am logged in as "patient@example.com" with password "patient123"
    And I have no mood tracked for today
    When I send a POST request to "/api/moods" with authentication and body:
      | rate |
      | 7    |
    Then the response status should be 201
    And the response message should be "Mood added successfully"
    And the response should contain a "mood"

  Scenario: Patient cannot add mood twice in the same day
    Given I am logged in as "patient@example.com" with password "patient123"
    And I have a mood tracked for today with rate 5
    When I send a POST request to "/api/moods" with authentication and body:
      | rate |
      | 8    |
    Then the response status should be 400
    And the response message should be "Mood already tracked for today. Use update instead."

  Scenario: Patient cannot add mood with invalid rate (too high)
    Given I am logged in as "patient@example.com" with password "patient123"
    And I have no mood tracked for today
    When I send a POST request to "/api/moods" with authentication and body:
      | rate |
      | 15   |
    Then the response status should be 400
    And the response message should be "Rate must be an integer between 1 and 10"

  Scenario: Patient cannot add mood with invalid rate (too low)
    Given I am logged in as "patient@example.com" with password "patient123"
    And I have no mood tracked for today
    When I send a POST request to "/api/moods" with authentication and body:
      | rate |
      | 0    |
    Then the response status should be 400
    And the response message should be "Rate must be an integer between 1 and 10"

  # Update mood scenarios
  Scenario: Patient updates today's mood
    Given I am logged in as "patient@example.com" with password "patient123"
    And I have a mood tracked for today with rate 5
    When I send a PUT request to "/api/moods" with authentication and body:
      | rate |
      | 8    |
    Then the response status should be 200
    And the response message should be "Mood updated successfully"

  Scenario: Patient cannot update mood when none exists for today
    Given I am logged in as "patient@example.com" with password "patient123"
    And I have no mood tracked for today
    When I send a PUT request to "/api/moods" with authentication and body:
      | rate |
      | 7    |
    Then the response status should be 404
    And the response message should be "No mood tracked for today"

  # Delete mood scenarios
  Scenario: Patient deletes today's mood
    Given I am logged in as "patient@example.com" with password "patient123"
    And I have a mood tracked for today with rate 5
    When I send a DELETE request to "/api/moods" with authentication
    Then the response status should be 200
    And the response message should be "Mood deleted successfully"

  Scenario: Patient cannot delete mood when none exists for today
    Given I am logged in as "patient@example.com" with password "patient123"
    And I have no mood tracked for today
    When I send a DELETE request to "/api/moods" with authentication
    Then the response status should be 404
    And the response message should be "No mood tracked for today"

  # Get moods scenarios
  Scenario: Patient retrieves their mood history
    Given I am logged in as "patient@example.com" with password "patient123"
    And I have a mood tracked for today with rate 7
    When I send a GET request to "/api/moods" with authentication
    Then the response status should be 200
    And the response should contain a list of moods
    And the response should indicate today is tracked

  # Authorization scenarios
  Scenario: Doctor cannot access patient mood endpoints
    Given I am logged in as "doctor@example.com" with password "doctor123"
    When I send a GET request to "/api/moods" with authentication
    Then the response status should be 403
    And the response message should be "Access denied"

  Scenario: Unauthenticated user cannot access mood endpoints
    When I send a GET request to "/api/moods" without authentication
    Then the response status should be 401
    And the response message should be "No token provided"
