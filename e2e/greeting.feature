Feature: Greeting

  Scenario: Greeting a Habitica MCP caller
    Given the Habitica MCP greeting tool is available
    When I ask it to greet Tatemz
    Then the greeting is Hello, Tatemz. Habitica MCP is alive.
