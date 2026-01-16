Feature: Doctor Patient Management
  As a doctor
  I want to manage my patients
  So that I can monitor their mental health and provide care

  Background:
    Given the API server is running
    And the following users exist in the system:
      | email                | password   | name            | role    |
      | doctor@example.com   | doctor123  | Dr. John Smith  | doctor  |
      | doctor2@example.com  | doctor456  | Dr. Jane Wilson | doctor  |
      | patient@example.com  | patient123 | Jane Doe        | patient |
      | patient2@example.com | patient456 | John Patient    | patient |

  # Get patients scenarios
  Scenario: Doctor retrieves list of patients
    Given I am logged in as "doctor@example.com" with password "doctor123"
    When I send a GET request to "/api/doctor/patients" with authentication
    Then the response status should be 200
    And the response should contain "myPatients" list
    And the response should contain "unassignedPatients" list

  Scenario: Patient cannot access doctor endpoints
    Given I am logged in as "patient@example.com" with password "patient123"
    When I send a GET request to "/api/doctor/patients" with authentication
    Then the response status should be 403
    And the response message should be "Access denied"

  Scenario: Unauthenticated user cannot access doctor endpoints
    When I send a GET request to "/api/doctor/patients" without authentication
    Then the response status should be 401
    And the response message should be "No token provided"

  # Assign patient scenarios
  Scenario: Doctor assigns an unassigned patient to themselves
    Given I am logged in as "doctor@example.com" with password "doctor123"
    And patient "patient@example.com" is not assigned to any doctor
    When I send a POST request to "/api/doctor/patients/{patientId}/assign" for patient "patient@example.com" with authentication
    Then the response status should be 200
    And the response message should be "Patient assigned successfully"

  Scenario: Doctor cannot assign a patient already assigned to another doctor
    Given I am logged in as "doctor@example.com" with password "doctor123"
    And patient "patient@example.com" is assigned to doctor "doctor2@example.com"
    When I send a POST request to "/api/doctor/patients/{patientId}/assign" for patient "patient@example.com" with authentication
    Then the response status should be 400
    And the response message should be "Patient is already assigned to another doctor"

  Scenario: Doctor cannot assign a patient already assigned to themselves
    Given I am logged in as "doctor@example.com" with password "doctor123"
    And patient "patient@example.com" is assigned to doctor "doctor@example.com"
    When I send a POST request to "/api/doctor/patients/{patientId}/assign" for patient "patient@example.com" with authentication
    Then the response status should be 400
    And the response message should be "Patient is already assigned to you"

  Scenario: Doctor cannot assign non-existent patient
    Given I am logged in as "doctor@example.com" with password "doctor123"
    When I send a POST request to "/api/doctor/patients/00000000-0000-0000-0000-000000000000/assign" with authentication
    Then the response status should be 404
    And the response message should be "Patient not found"

  # Unassign patient scenarios
  Scenario: Doctor unassigns their patient
    Given I am logged in as "doctor@example.com" with password "doctor123"
    And patient "patient@example.com" is assigned to doctor "doctor@example.com"
    When I send a DELETE request to "/api/doctor/patients/{patientId}/assign" for patient "patient@example.com" with authentication
    Then the response status should be 200
    And the response message should be "Patient unassigned successfully"

  Scenario: Doctor cannot unassign a patient not assigned to them
    Given I am logged in as "doctor@example.com" with password "doctor123"
    And patient "patient@example.com" is assigned to doctor "doctor2@example.com"
    When I send a DELETE request to "/api/doctor/patients/{patientId}/assign" for patient "patient@example.com" with authentication
    Then the response status should be 404
    And the response message should be "Patient not found or not assigned to you"

  # View patient moods scenarios
  Scenario: Doctor views mood history of their assigned patient
    Given I am logged in as "doctor@example.com" with password "doctor123"
    And patient "patient@example.com" is assigned to doctor "doctor@example.com"
    And patient "patient@example.com" has mood entries
    When I send a GET request to "/api/doctor/patients/{patientId}/moods" for patient "patient@example.com" with authentication
    Then the response status should be 200
    And the response should contain patient information
    And the response should contain "moods" list

  Scenario: Doctor cannot view moods of patient not assigned to them
    Given I am logged in as "doctor@example.com" with password "doctor123"
    And patient "patient@example.com" is assigned to doctor "doctor2@example.com"
    When I send a GET request to "/api/doctor/patients/{patientId}/moods" for patient "patient@example.com" with authentication
    Then the response status should be 404
    And the response message should be "Patient not found or not assigned to you"

  Scenario: Doctor cannot view moods of unassigned patient
    Given I am logged in as "doctor@example.com" with password "doctor123"
    And patient "patient@example.com" is not assigned to any doctor
    When I send a GET request to "/api/doctor/patients/{patientId}/moods" for patient "patient@example.com" with authentication
    Then the response status should be 404
    And the response message should be "Patient not found or not assigned to you"
