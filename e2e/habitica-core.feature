Feature: Habitica core tools

  Scenario: Saying hello without Habitica credentials
    Given the fake Habitica gateway is available
    When I ask for hello world
    Then the MCP greeting is Hello, world!

  Scenario: Listing todo tasks
    Given the fake Habitica gateway is available
    When I list todo tasks
    Then the visible task is Ship Habitica MCP

  Scenario: Reading profile and stats
    Given the fake Habitica gateway is available
    When I read the user profile
    Then the result text is Tatemz
    When I read stats
    Then the result text is level 7

  Scenario: Reading a single task
    Given the fake Habitica gateway is available
    When I get task task-1
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

  Scenario: Managing tags
    Given the fake Habitica gateway is available
    When I list tags
    Then the result text is Focus
    When I create tag Deep Work
    Then the result text is Deep Work

  Scenario: Managing checklist items
    Given the fake Habitica gateway is available
    When I add checklist item Review output to task task-1
    Then the changed task is Ship Habitica MCP
    When I update checklist item check-1 on task task-1 to Done
    Then the changed task is Ship Habitica MCP
    When I score checklist item check-1 on task task-1
    Then the changed task is Ship Habitica MCP
    When I delete checklist item check-1 on task task-1
    Then the changed task is Ship Habitica MCP

  Scenario: Reading inventory
    Given the fake Habitica gateway is available
    When I read inventory
    Then the result text is Wolf-Base

  Scenario: Reading a notification
    Given the fake Habitica gateway is available
    When I list notifications
    Then the result text is Welcome
    When I read notification notification-1
    Then the mutation message is changed

  Scenario: Managing rewards
    Given the fake Habitica gateway is available
    When I list rewards
    Then the visible task is Coffee
    When I create reward Tea
    Then the changed task is Tea
    When I update reward reward-1 to Coffee updated
    Then the changed task is Coffee updated
    When I buy reward reward-1
    Then the mutation message is changed
    When I delete reward reward-1
    Then the mutation message is changed

  Scenario: Buying shop items
    Given the fake Habitica gateway is available
    When I list shop items
    Then the result text is Potion
    When I buy shop item potion
    Then the mutation message is changed

  Scenario: Managing pets and mounts
    Given the fake Habitica gateway is available
    When I hatch pet Wolf Base
    Then the mutation message is changed
    When I feed pet Wolf-Base Meat
    Then the mutation message is changed
    When I equip pet Wolf-Base
    Then the mutation message is changed
    When I equip mount Wolf-Base
    Then the mutation message is changed

  Scenario: Casting skills
    Given the fake Habitica gateway is available
    When I list skills
    Then the result text is Burst of Flames
    When I cast skill fireball at task-1
    Then the mutation message is changed
