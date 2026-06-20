Feature: Habitica core tools

  Scenario: Listing todo tasks
    Given the fake Habitica gateway is available
    When I list todo tasks
    Then the visible task is Ship Habitica MCP

  Scenario: Creating a todo
    Given the fake Habitica gateway is available
    When I create a todo named Write schemas
    Then the changed task is Write schemas

  Scenario: Updating a task
    Given the fake Habitica gateway is available
    When I update task task-1 to Write sharper tests
    Then the changed task is Write sharper tests

  Scenario: Deleting a task
    Given the fake Habitica gateway is available
    When I delete task task-1
    Then the mutation message is changed

  Scenario: Scoring a habit
    Given the fake Habitica gateway is available
    When I score task task-1 up
    Then the changed task is Ship Habitica MCP

  Scenario: Mutating a checklist item
    Given the fake Habitica gateway is available
    When I add checklist item Review output to task task-1
    Then the changed task is Ship Habitica MCP

  Scenario: Reading a notification
    Given the fake Habitica gateway is available
    When I read notification notification-1
    Then the mutation message is changed
